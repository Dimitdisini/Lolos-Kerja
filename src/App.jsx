import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import CvStudio, { DEFAULT_PROFILE } from './components/CvStudio.jsx';
import JobCatalog from './components/JobCatalog.jsx';
import BlastHub from './components/BlastHub.jsx';
import Comparison from './components/Comparison.jsx';
import Footer from './components/Footer.jsx';
import { curatedJobs } from './data/curatedJobs.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [candidateProfile, setCandidateProfile] = useState(DEFAULT_PROFILE);
  const [selectedJobs, setSelectedJobs] = useState(() => {
    // Default pre-select top 2 high-quality verified jobs so users can test BlastHub immediately
    return curatedJobs.slice(0, 2);
  });

  const handleNavigate = (tabKey) => {
    setActiveTab(tabKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleJob = (job) => {
    setSelectedJobs(prev => {
      const exists = prev.some(j => String(j.id) === String(job.id));
      if (exists) {
        return prev.filter(j => String(j.id) !== String(job.id));
      } else {
        return [...prev, job];
      }
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900 flex flex-col justify-between">
      
      {/* 1. Sticky Navbar Modern ala Dospem.id */}
      <Navbar onNavigate={handleNavigate} activeTab={activeTab} />

      {/* Main Content Area */}
      <main className="flex-1">

        {/* Tab: Beranda / Home */}
        {activeTab === 'home' && (
          <>
            <Hero 
              onStartCv={() => handleNavigate('cv')}
              onBrowseJobs={() => handleNavigate('jobs')}
            />
            <HowItWorks onSelectStep={handleNavigate} />
            <Comparison />
          </>
        )}

        {/* Tab: 3 Langkah Kerja */}
        {activeTab === 'steps' && (
          <div className="py-8">
            <HowItWorks onSelectStep={handleNavigate} />
          </div>
        )}

        {/* Tab: CV Studio (Langkah 1) */}
        {activeTab === 'cv' && (
          <div className="animate-fade-in">
            <CvStudio 
              profile={candidateProfile}
              onProfileChange={setCandidateProfile}
              onProceedToJobs={() => handleNavigate('jobs')}
            />
          </div>
        )}

        {/* Tab: Katalog Loker (Langkah 2) */}
        {activeTab === 'jobs' && (
          <div className="animate-fade-in">
            <JobCatalog 
              selectedJobs={selectedJobs}
              candidateProfile={candidateProfile}
              onProfileChange={setCandidateProfile}
              onToggleJob={handleToggleJob}
              onProceedToBlast={() => handleNavigate('blast')}
            />
          </div>
        )}

        {/* Tab: Kirim Lamaran / Blast Hub (Langkah 3) */}
        {activeTab === 'blast' && (
          <div className="animate-fade-in">
            <BlastHub 
              selectedJobs={selectedJobs}
              candidateProfile={candidateProfile}
              onProfileChange={setCandidateProfile}
              onBackToJobs={() => handleNavigate('jobs')}
            />
          </div>
        )}

        {/* Tab: Perbandingan */}
        {activeTab === 'comparison' && (
          <div className="py-8 animate-fade-in">
            <Comparison />
          </div>
        )}

      </main>

      {/* 5. Clean Academic-Modern Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}
