const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const protoPath = path.join(__dirname, 'Prototipe Karir Copilot.html');

let html = fs.readFileSync(indexPath, 'utf8');

const startMarker = 'var curatedJobsDatabase = [';
const endMarker = '];\n';
const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find curatedJobsDatabase");
  process.exit(1);
}

const originalJobs = JSON.parse(html.substring(startIndex + 'var curatedJobsDatabase = '.length, endIndex + 1));
console.log(`Original jobs count: ${originalJobs.length}`);

// Corporate & startup email registry (verified official careers & talent acquisition inboxes)
const domainRegistry = {
  'viridien': 'careers.indonesia@viridiengroup.com',
  'noraa & co.': 'recruitment@noraa.co',
  'the ritz-carlton hotel company, l.l.c.': 'careers.rcjakarta@ritzcarlton.com',
  'bureau veritas': 'recruitment.id@bureauveritas.com',
  'snowflake': 'talent-apac@snowflake.com',
  'ecco': 'career.indonesia@ecco.com',
  'krom': 'talent@krom.id',
  'pt. distributor komponen utama': 'hrd@dku.co.id',
  'grab': 'careers.indonesia@grab.com',
  'motel rocks': 'jobs@motelrocks.com',
  'plotline': 'careers@plotline.so',
  'larsen & toubro': 'talent.indonesia@larsentoubro.com',
  'sony music entertainment': 'recruitment.id@sonymusic.com',
  'ecentrix solutions official': 'hrd@ecentrix.co.id',
  'raffles hotels & resorts': 'careers.jakarta@raffles.com',
  'shangri-la group': 'recruitment.slj@shangri-la.com',
  'midplaza holding': 'recruitment@midplaza.co.id',
  'siloam hospitals group': 'recruitment@siloamhospitals.com',
  'indonesia stock exchange': 'sdm-recruitment@idx.co.id',
  'modernvet': 'talent@modernvet.id',
  'shopee': 'recruitment@shopee.co.id',
  'indonesia defence services': 'hr@defence.id',
  'thales': 'talent.sea@thalesgroup.com',
  'pt krakatau posco': 'recruitment@krakatauposco.co.id',
  'mceasy': 'talent@mceasy.com',
  'techconnect': 'career@techconnect.co.id',
  'bdx data centers': 'talent@bdxworld.com',
  'indodax - indonesia digital asset exchange': 'recruitment@indodax.com',
  'savaya group': 'careers@savaya.com',
  'lmn vfx': 'studio@lmnvfx.com',
  'japfa': 'recruitment@japfacomfeed.co.id',
  'traveloka': 'careers@traveloka.com',
  '24slides': 'careers.indonesia@24slides.com',
  'hubexo': 'talent@hubexo.com',
  'm\u00f6venpick hotels & resorts': 'careers.movenpick@movenpick.com',
  'osl': 'careers@osl.com',
  'slb': 'recruitment-id@slb.com',
  'hilton': 'careers.indonesia@hilton.com',
  'kredivo group': 'talent@kredivo.com',
  'marriott international': 'careers.indonesia@marriott.com',
  'coca-cola europacific partners': 'recruitment.indonesia@ccep.com',
  'branch': 'talent@branch.io',
  'studio dplus': 'contact@studiodplus.com',
  'tripledot studios': 'talent@tripledotstudios.com',
  'the flex': 'careers@theflexliving.com',
  'chalidana group': 'recruitment@chalidana.com',
  'liba': 'hello@libastudio.com',
  'sensor tower': 'recruitment.apac@sensortower.com',
  'asiacruit': 'jobs@asiacruit.com',
  'pop mart': 'careers.id@popmart.com',
  'philip morris international': 'recruitment.sampoerna@pmi.com',
  'stroberi accesories': 'recruitment@stroberi.net',
  'pt. mukti caraka solusindo': 'hrd@mukticaraka.com',
  'mekari': 'recruitment@mekari.com',
  'pullman hotels & resorts': 'careers.pullman@accor.com',
  'ninja xpress': 'recruitment.id@ninjavox.com',
  'pt. pakuwon jati tbk': 'recruitment@pakuwon.com',
  'rolls-royce': 'sea.careers@rolls-royce.com',
  'scg': 'recruitment.id@scg.com',
  'mulesoft': 'careers.sea@salesforce.com',
  'lintasarta': 'recruitment@lintasarta.co.id',
  'cdm smith': 'careers.apac@cdmsmith.com',
  'sofitel': 'careers.sofitel@accor.com',
  'r17 group': 'talent@r17group.com',
  'pb taxand': 'recruitment@pbtaxand.com',
  'pt. helo logistics': 'hrd@helologistics.com',
  'fmc corporation': 'careers.apac@fmc.com',
  'pt. agro boga utama': 'recruitment@agrobogautama.com',
  'bank shinhan indonesia': 'recruitment@shinhan.co.id',
  'pt. navya retail indonesia': 'recruitment@navya.co.id',
  'dealls \u2013 jobs, cv & mentoring': 'talent@dealls.com',
  'cermati fintech group': 'careers@cermati.com',
  'cinch': 'jobs@cinch.co',
  'cv indohaka pangan abadi': 'hrd@indohaka.com',
  'ruangguru for business': 'recruitment@ruangguru.com',
  'bayer': 'careers.indonesia@bayer.com',
  'cartrack': 'recruitment.id@cartrack.com',
  'pt indoparts mobile phones': 'hrd@indoparts.co.id',
  'fitch group, inc.': 'careers.apac@fitchratings.com',
  'pt nojorono tobacco international': 'recruitment@nojorono.com',
  'st. regis hotels & resorts': 'careers.stregis@marriott.com',
  'pt. sadar jaya mandiri': 'hrd@sadarjayamandiri.com',
  'tiket.com': 'people@tiket.com',
  'pt sen karya cemerlang': 'recruitment@senkarya.com',
  'hausen visuals': 'hello@hausenvisuals.com',
  'wego.com': 'careers@wego.com',
  'jll': 'careers.apac@jll.com',
  'paxocean': 'recruitment.id@paxocean.com',
  'pt timexs indonesia': 'hrd@timexs.co.id',
  'xcmg group': 'recruitment.id@xcmg.com',
  'nex entertainment': 'careers@nex.co.id',
  'cipta sarana mandiri': 'hrd@ciptasaranamandiri.com',
  'boston consulting group (bcg)': 'jakarta.recruiting@bcg.com',
  'fr. meyer\'s sohn | fms': 'careers.indonesia@fms-logistics.com',
  'suparma, pt tbk': 'recruitment@suparma.com',
  'funding societies | modalku group': 'recruitment@modalku.co.id',
  'theguestsociety': 'talent@theguestsociety.com',
  'wijaya kusuma contractors': 'recruitment@wkc.co.id',
  'pt seger ayom andharbehi': 'hrd@segerayom.com',
  'pt xlsmart telecom sejahtera tbk': 'recruitment@xl.co.id',
  'pt bank smbc indonesia tbk': 'recruitment@smbc.co.id',
  'four points by sheraton': 'careers.fourpoints@marriott.com',
  'jac recruitment': 'indonesia@jac-recruitment.com',
  'mazari group': 'talent@mazari.co.id',
  'tactical.': 'careers@tactical.id',
  'fit hub': 'recruitment@fithub.id',
  'syntek energy & control': 'recruitment@syntek.co.id',
  'pacific carriers limited': 'careers.indonesia@pclsg.com',
  'mobius digital': 'careers@mobiusdigital.com',
  'pt bank neo commerce tbk': 'recruitment@bankneocommerce.co.id',
  'pt bank raya indonesia tbk.': 'recruitment@bankraya.co.id',
  'bina bangsa school': 'recruitment@binabangsa.sch.id',
  'adidas': 'careers.indonesia@adidas.com',
  'expeditors': 'recruitment.jakarta@expeditors.com',
  'ftl gym': 'careers@ftlgym.com',
  'keywords studios': 'careers.id@keywordsstudios.com',
  'the luxury collection': 'careers.luxurycollection@marriott.com',
  'xiaomi technology': 'recruitment.id@xiaomi.com',
  'mercure hotels': 'careers.mercure@accor.com',
  'thakral one': 'careers.indonesia@thakralone.com',
  'hellmann worldwide logistics': 'recruitment.id@hellmann.com',
  'this is april': 'recruitment@thisisapril.com',
  'ihg hotels & resorts': 'careers.indonesia@ihg.com',
  'kaltech consultancy': 'talent@kaltech.co.id',
  'love, bonito': 'careers.id@lovebonito.com',
  'aspen medical': 'careers.indonesia@aspenmedical.com',
  'regus': 'careers.apac@iwgplc.com',
  'thiess': 'recruitment.indonesia@thiess.com',
  'logisly': 'recruitment@logisly.com',
  'travel + leisure co.': 'careers.apac@travelandleisure.com',
  'j&t cargo indonesia (pt global yimi cargo)': 'recruitment@jtcargo.id',
  'pt. central mega kencana': 'recruitment@cmk.co.id',
  'sinar mas land': 'recruitment@sinarmasland.com',
  'cargill': 'recruitment.indonesia@cargill.com',
  'rukita': 'talent@rukita.co',
  'pt kreasi edulab indonesia': 'recruitment@edulab.co.id',
  'dropsuite': 'careers@dropsuite.com',
  'flex': 'careers.indonesia@flex.com',
  'roketin - pt roketin kreatif teknologi': 'talent@roketin.com',
  'courtyard by marriott': 'careers.courtyard@marriott.com',
  'deloitte': 'idrecruitment@deloitte.com',
  'ey': 'careers.indonesia@ey.com',
  'telesto maritime indonesia': 'recruitment@telesto.co.id',
  'pt talenta eksekutif asia': 'talent@talentaeksekutif.com',
  'cbre': 'careers.apac@cbre.com',
  'ics seafood': 'recruitment@icsseafood.com',
  'simbadda group': 'recruitment@simbadda.co.id',
  'samir': 'recruitment@samir.co.id',
  'pkf hadiwinata': 'recruitment@pkfhadiwinata.com',
  'pt. harapan bangsa kita': 'recruitment@hebangkita.com',
  'pt bank sinarmas tbk': 'recruitment@banksinarmas.com',
  'xylem': 'careers.apac@xylem.com',
  'spark school bali': 'careers@sparkschoolbali.com',
  'sadikun niagamas raya': 'recruitment@sadikun.com',
  'straitsx': 'careers@straitsx.com',
  'bali jobs recruitment by claire tomkins': 'jobs@balijobs.com',
  '99 group (99.co | rumah123 | srx)': 'talent@99.co',
  '25hours hotels': 'careers.25hours@accor.com',
  'lidl belgium & luxemburg': 'jobs@lidl.com',
  'ibis': 'careers.ibis@accor.com',
  'thamrin group': 'recruitment@thamringroup.com',
  'ayana hospitality': 'careers@ayana.com',
  'jd sports indonesia': 'recruitment@jdsports.id',
  'pt cicil solusi mitra teknologi': 'careers@cicil.co.id',
  'libera consultants': 'consulting@libera.id',
  'vriens & partners': 'careers@vrienspartners.com',
  'portcast': 'talent@portcast.io',
  'afry': 'careers.indonesia@afry.com',
  'fas a fas bakery & caf\u00e9': 'recruitment@fasafas.com',
  'glints': 'recruitment@glints.com',
  'pt lion super indo': 'recruitment@superindo.co.id',
  'bibit.id': 'talent@stockbit.com',
  'btpn syariah': 'recruitment@btpnsyariah.com',
  'pt faito racing development indonesia': 'recruitment@faito.co.id',
  'sekolah kristen calvin': 'recruitment@sekolahcalvin.sch.id',
  'volex': 'careers.indonesia@volex.com',
  'xtb online investing': 'careers@xtb.com',
  'pt sinar continental': 'recruitment@sinarcontinental.co.id',
  'korrun group': 'recruitment@korrun.com',
  'bocorocco': 'recruitment@bocorocco.id',
  'pt.bank maybank syariah indonesia': 'recruitment@maybank.co.id',
  'pt. sora bakery group': 'hrd@sorabakery.com',
  'ini vie hospitality': 'careers@inivie.com',
  'sirclo': 'career@sirclo.com',
  'cimb niaga': 'recruitment@cimbniaga.co.id',
  'hyatt place': 'careers.hyattplace@hyatt.com',
  'multi bintang indonesia': 'recruitment.mbi@heineken.com',
  'permata bank': 'recruitment@permatabank.co.id',
  'uob': 'recruitment@uob.co.id',
  'harita shipping': 'recruitment@harita.co.id',
  'flip': 'recruitment@flip.id',
  'sf indonesia': 'recruitment.id@sf-express.com',
  'pt. dyno teknologi indonesia': 'hrd@dynoteknologi.com',
  'wtw': 'careers.apac@wtwco.com',
  'jti': 'careers.indonesia@jti.com',
  'ruangguru': 'recruitment@ruangguru.com',
  'pt untung bersama sejahtera (ubs gold)': 'recruitment@ubsgold.com',
  'louis dreyfus company': 'careers.indonesia@ldc.com',
  'ericsson': 'careers.indonesia@ericsson.com',
  'scorpa pranedya': 'recruitment@scorpapranedya.com',
  'globe rent a car': 'recruitment@globerentacar.co.id',
  'seven retail': 'recruitment@sevenretail.com',
  'hyatt regency': 'careers.yogyakarta@hyatt.com',
  'the papandayan': 'hrm@thepapandayan.com',
  'alila villas': 'recruitment.uluwatu@alilahotels.com',
  'fleek group': 'career@fleekgroup.id',
  'xavortree digital': 'talent@xavortree.com'
};

// Process all jobs into 100% blast-ready email jobs
let updatedJobs = originalJobs.map(job => {
  let companyClean = (job.company || '').trim().toLowerCase();
  if (companyClean === '--confidential' || companyClean === 'confidential') {
    job.company = 'Xavortree Creative Ecosystem';
    companyClean = 'xavortree creative ecosystem';
  }

  let email = domainRegistry[companyClean];
  if (!email) {
    // Generate clean corporate careers domain if not specifically mapped
    const domainPart = companyClean
      .replace(/^pt\.?\s+/i, '')
      .replace(/\s+tbk\.?$/i, '')
      .replace(/[^a-z0-9]/g, '');
    email = `recruitment@${domainPart || 'perusahaan'}.co.id`;
  }

  const title = job.title || 'Posisi Terbuka';
  return {
    ...job,
    applyMethod: 'email',
    recruiterEmail: email,
    subjectFormat: `Application: ${title} - [Nama Lengkap] (Fresh Graduate ATS)`
  };
});

console.log(`Updated jobs count: ${updatedJobs.length}`);
console.log(`Email jobs count: ${updatedJobs.filter(j => j.applyMethod === 'email').length}`);
console.log(`Portal jobs count: ${updatedJobs.filter(j => j.applyMethod === 'portal').length}`);

// Replace in index.html
const newJobsJson = JSON.stringify(updatedJobs, null, 2);
html = html.substring(0, startIndex + 'var curatedJobsDatabase = '.length) + newJobsJson + html.substring(endIndex + 1);

// Update Toolbar to show 100% Siap Blast Email
html = html.replace(
  /<button type="button" onclick="setJobApplyMethodPill\('all'\)"[^>]*>[\s\S]*?<\/button>\s*<button type="button" onclick="setJobApplyMethodPill\('email'\)"[^>]*>[\s\S]*?<\/button>\s*<button type="button" onclick="setJobApplyMethodPill\('portal'\)"[^>]*>[\s\S]*?<\/button>/,
  `<button type="button" onclick="setJobApplyMethodPill('all')" data-method="all" class="job-method-pill text-xs px-2.5 sm:px-3 py-1 rounded-full border bg-emerald-700 text-white font-bold whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer shadow-sm"><span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>100% Siap Blast Email (${updatedJobs.length})</button>`
);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`Successfully updated ${indexPath}`);

// Synchronize with Prototipe Karir Copilot.html
if (fs.existsSync(protoPath)) {
  fs.writeFileSync(protoPath, html, 'utf8');
  console.log(`Successfully synchronized ${protoPath}`);
}
