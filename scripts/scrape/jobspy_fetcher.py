#!/usr/bin/env python3
"""
scripts/scrape/jobspy_fetcher.py
Zero-Cost Automated Job Fetcher utilizing python-jobspy & Free Open APIs.
Supports:
1. python-jobspy (LinkedIn, Indeed, Glassdoor, ZipRecruiter) without browser automation
2. Arbeitnow Free Job API (fallback / remote tech listings)
Outputs normalized raw jobs to scripts/scrape/jobspy-raw-jobs.json
"""

import os
import sys
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "jobspy-raw-jobs.json")

SEARCH_QUERIES = [
    "fresh graduate",
    "management trainee",
    "junior software engineer",
    "business development",
    "marketing associate",
    "finance staff"
]

def fetch_via_jobspy():
    """Attempt scraping via python-jobspy library if available."""
    try:
        from jobspy import scrape_jobs
    except ImportError:
        logging.warning("python-jobspy is not installed. To install: pip install python-jobspy")
        return []

    all_jobs = []
    logging.info("Running python-jobspy for Indonesian & Remote fresh graduate jobs...")

    for query in SEARCH_QUERIES[:3]:  # Top targeted roles
        try:
            logging.info(f"Querying jobspy for: '{query}'")
            jobs = scrape_jobs(
                site_name=["indeed", "linkedin", "glassdoor"],
                search_term=query,
                location="Indonesia",
                results_wanted=15,
                hours_old=72,
                country_indeed="indonesia"
            )
            if jobs is not None and not jobs.empty:
                records = jobs.to_dict(orient="records")
                for r in records:
                    all_jobs.append({
                        "source": f"jobspy_{r.get('site', 'web')}",
                        "title": r.get("title", ""),
                        "company": r.get("company", ""),
                        "location": r.get("location", "Indonesia"),
                        "description": r.get("description", ""),
                        "apply_url": r.get("job_url", ""),
                        "apply_email": r.get("emails", "") if isinstance(r.get("emails"), str) else None,
                        "posted_at": str(r.get("date_posted", datetime.utcnow().isoformat()))
                    })
        except Exception as e:
            logging.warning(f"Failed jobspy query '{query}': {e}")

    logging.info(f"Successfully collected {len(all_jobs)} jobs via python-jobspy.")
    return all_jobs

def fetch_via_free_apis():
    """Fallback / supplementary fetcher using Arbeitnow Free API."""
    import urllib.request
    all_jobs = []
    url = "https://www.arbeitnow.com/api/job-board-api"
    logging.info(f"Fetching supplementary listings from Arbeitnow Free API ({url})...")
    
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LolosKerjaBot/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                items = data.get("data", [])
                for it in items:
                    title = it.get("title", "")
                    # Filter only junior / mid / general relevant
                    if not any(k in title.lower() for k in ["senior", "lead", "head", "director", "manager"]):
                        all_jobs.append({
                            "source": "arbeitnow_api",
                            "title": title,
                            "company": it.get("company_name", ""),
                            "location": it.get("location", "Remote"),
                            "description": it.get("description", "")[:500],
                            "apply_url": it.get("url", ""),
                            "skills": it.get("tags", []),
                            "posted_at": datetime.fromtimestamp(it.get("created_at", datetime.utcnow().timestamp())).isoformat()
                        })
                logging.info(f"Retrieved {len(all_jobs)} jobs from Arbeitnow API.")
    except Exception as e:
        logging.warning(f"Arbeitnow fetch notice: {e}")

    return all_jobs

def main():
    collected = []
    
    # 1. Try python-jobspy
    jobspy_jobs = fetch_via_jobspy()
    collected.extend(jobspy_jobs)

    # 2. Try free APIs
    if len(collected) < 10:
        api_jobs = fetch_via_free_apis()
        collected.extend(api_jobs)

    logging.info(f"Total raw jobs gathered: {len(collected)}")

    # Write out JSON
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(collected, f, indent=2, ensure_ascii=False)

    logging.info(f"Saved to {OUTPUT_PATH}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
