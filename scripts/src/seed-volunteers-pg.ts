import pkg from "pg";
const { Client } = pkg;
import crypto from "crypto";

// bcryptjs-compatible hash using Node crypto (PBKDF2 as placeholder - actually we need real bcrypt)
// We'll use a raw bcrypt implementation via the bcryptjs package
import bcrypt from "bcryptjs";

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Coordinator
  const existingCoord = await client.query("SELECT id FROM vol_users WHERE email = $1 LIMIT 1", ["coordinator@ghri.org"]);
  if (existingCoord.rows.length === 0) {
    const hash = await bcrypt.hash("Coord1234!", 12);
    await client.query(
      `INSERT INTO vol_users (email, password_hash, name, avatar_initials, role, status, skills, availability, bio, consented_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())`,
      ["coordinator@ghri.org", hash, "Dr. Amara Osei", "AO", "coordinator", "active", "Program Management, Training, Outreach", "Mon-Fri", "GHRI Volunteer Coordinator"]
    );
    console.log("Created coordinator: coordinator@ghri.org / Coord1234!");
  } else {
    console.log("Coordinator already exists");
  }

  // Demo volunteer
  const existingVol = await client.query("SELECT id FROM vol_users WHERE email = $1 LIMIT 1", ["volunteer@demo.ghri.org"]);
  if (existingVol.rows.length === 0) {
    const hash = await bcrypt.hash("Demo1234!", 12);
    await client.query(
      `INSERT INTO vol_users (email, password_hash, name, avatar_initials, role, status, skills, availability, consented_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())`,
      ["volunteer@demo.ghri.org", hash, "Jordan Lee", "JL", "volunteer", "active", "Community Outreach, First Aid", "Weekends"]
    );
    console.log("Created demo volunteer: volunteer@demo.ghri.org / Demo1234!");
  } else {
    console.log("Demo volunteer already exists");
  }

  // Training resources
  const existingTraining = await client.query("SELECT id FROM vol_training_resources LIMIT 1");
  if (existingTraining.rows.length === 0) {
    const resources = [
      ["GHRI Mission & Values", "An introduction to GHRI Foundation's mission, vision, and core values for all new volunteers.", "# Welcome to GHRI Foundation\n\nGHRI Foundation is dedicated to providing equitable healthcare access to underserved communities worldwide.\n\n## Our Core Values\n- **Equity**: Every person deserves quality healthcare\n- **Integrity**: We operate with transparency and accountability\n- **Compassion**: We serve with empathy and respect\n- **Innovation**: We seek creative solutions to complex health challenges", "article", null, 15, true, 1],
      ["HIPAA & Patient Privacy Training", "Mandatory HIPAA compliance training for all volunteers who may interact with patient information.", "# HIPAA Training for GHRI Volunteers\n\n## What is HIPAA?\nHIPAA protects patient health information (PHI).\n\n## Key Rules\n- Minimum Necessary: Only access the PHI needed to do your job\n- No Unauthorized Disclosure: Never share patient info without authorization\n- Secure Handling: Use secure channels for any PHI communication\n- Reporting: Report any suspected breach immediately to a coordinator", "document", null, 30, true, 2],
      ["Cultural Competency in Healthcare", "Learn to provide culturally sensitive care and communication across diverse communities.", "# Cultural Competency Training\n\n## Why It Matters\nGHRI serves diverse communities across many cultures, languages, and belief systems.\n\n## Key Principles\n- Self-Awareness: Understand your own cultural biases\n- Knowledge: Learn about the communities you serve\n- Skills: Adapt your communication style\n- Encounters: Apply cultural competency in every interaction", "article", null, 25, true, 3],
      ["Emergency Procedures & Safety", "Critical safety procedures all volunteers must know before participating in any GHRI program.", "# Emergency Procedures\n\n## Medical Emergency\n1. Call 911 immediately\n2. Notify the nearest GHRI staff member\n3. Do not attempt medical interventions unless trained\n\n## Incident Reporting\nAll incidents must be reported within 24 hours.", "document", null, 20, true, 4],
      ["Telehealth Technology Basics", "Introduction to the technology platforms and tools used in GHRI's telehealth programs.", "# Telehealth Technology for Volunteers\n\n## Platforms We Use\n- GHRI Portal: For scheduling, messaging, and documentation\n- Jitsi Meet: For secure video consultations\n\n## Getting Started\n1. Set up your volunteer portal account\n2. Test your camera and microphone\n3. Use a private, quiet location for telehealth sessions", "video", "https://meet.jit.si", 20, false, 5],
      ["Community Health Outreach Best Practices", "Strategies and best practices for effective community health outreach events.", "# Community Health Outreach\n\n## Planning an Outreach Event\n1. Identify the target community and their specific health needs\n2. Partner with trusted community organizations\n3. Prepare multilingual materials\n\n## During the Event\n- Greet participants warmly and introduce yourself\n- Listen actively to community members' concerns", "article", null, 30, false, 6],
    ];
    for (const [title, desc, content, type, url, dur, req, sort] of resources) {
      await client.query(
        `INSERT INTO vol_training_resources (title, description, content, resource_type, url, duration_minutes, required, sort_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [title, desc, content, type, url, dur, req, sort]
      );
    }
    console.log("Created 6 training resources");
  } else {
    console.log("Training resources already exist");
  }

  // Waivers
  const existingWaivers = await client.query("SELECT id FROM vol_waivers LIMIT 1");
  if (existingWaivers.rows.length === 0) {
    const waivers = [
      ["Volunteer Participation Agreement", "v2.1", true, `GHRI FOUNDATION VOLUNTEER PARTICIPATION AGREEMENT

This Volunteer Participation Agreement is entered into between the volunteer and GHRI Foundation.

1. VOLUNTARY SERVICE
The Volunteer agrees to provide services voluntarily and without compensation.

2. SCOPE OF SERVICE
The Volunteer agrees to follow all GHRI Foundation policies, attend required training, maintain professional conduct, and report any concerns to a coordinator.

3. CONFIDENTIALITY
The Volunteer agrees to maintain strict confidentiality regarding patient information and organizational data.

4. HIPAA COMPLIANCE
The Volunteer acknowledges receipt of HIPAA training and agrees to comply with all HIPAA requirements.

5. TERMINATION
Either party may terminate this agreement at any time.

By signing, the Volunteer acknowledges reading and agreeing to these terms.`],
      ["HIPAA Confidentiality Agreement", "v3.0", true, `GHRI FOUNDATION HIPAA CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This agreement is required for all volunteers who may have access to Protected Health Information (PHI).

1. DEFINITION OF PHI
PHI includes any information relating to an individual's health condition that can identify the individual.

2. PERMITTED USES
The Volunteer may use PHI only as necessary to perform authorized volunteer duties.

3. PROHIBITED ACTIONS
The Volunteer shall NOT access PHI beyond their duties, discuss patient info in public areas, or share login credentials.

4. REPORTING BREACHES
Any suspected breach must be reported immediately to privacy@ghri.org.

5. CONSEQUENCES
Violations may result in removal and civil/criminal penalties under HIPAA.`],
      ["Liability Waiver and Release", "v1.5", true, `GHRI FOUNDATION VOLUNTEER LIABILITY WAIVER AND RELEASE

PLEASE READ CAREFULLY. BY SIGNING, YOU AGREE TO LIMIT YOUR LEGAL RIGHTS.

1. ASSUMPTION OF RISK
The Volunteer acknowledges that activities may involve risks including physical injury and exposure to communicable diseases.

2. RELEASE OF LIABILITY
The Volunteer releases GHRI Foundation and its agents from liability arising from volunteer activities, except for gross negligence or intentional misconduct.

3. MEDICAL AUTHORIZATION
In an emergency, the Volunteer authorizes GHRI Foundation staff to seek emergency medical treatment on their behalf.`],
      ["Social Media & Communication Policy", "v1.2", false, `GHRI FOUNDATION SOCIAL MEDIA AND COMMUNICATION POLICY FOR VOLUNTEERS

1. GENERAL PRINCIPLES
Never share patient information on social media. Distinguish personal opinions from official GHRI positions. Be respectful and professional.

2. AUTHORIZED SHARING
Volunteers MAY share publicly available GHRI announcements, events, and mission information.

3. PROHIBITED CONTENT
Volunteers may NOT share patient information, internal disputes, or anything damaging to GHRI's reputation.

4. MEDIA INQUIRIES
All media inquiries must be referred to communications@ghri.org.`],
    ];
    for (const [title, version, req, content] of waivers) {
      await client.query(
        `INSERT INTO vol_waivers (title, version, required, content, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [title, version, req, content]
      );
    }
    console.log("Created 4 waivers");
  } else {
    console.log("Waivers already exist");
  }

  // Events
  const existingEvents = await client.query("SELECT id FROM vol_events LIMIT 1");
  if (existingEvents.rows.length === 0) {
    const coordResult = await client.query("SELECT id FROM vol_users WHERE email = $1 LIMIT 1", ["coordinator@ghri.org"]);
    const coordId = coordResult.rows[0]?.id ?? null;
    const now = new Date();
    const events = [
      ["Volunteer Orientation — New Cohort", "Welcome orientation for all new GHRI volunteers. Meet the team and get set up with your volunteer account.", "GHRI Main Office, Conference Room A", 3, 5, 25, "Orientation"],
      ["Community Health Fair — Eastside", "Quarterly health fair providing free screenings, health education, and resource referrals to underserved residents.", "Eastside Community Center, 4500 MLK Blvd", 7, 13, 20, "Health Fair"],
      ["Senior Center Wellness Check", "Monthly wellness check visits to our partner senior living centers.", "Sunrise Senior Living & Maplewood Terrace", 10, 14, 12, "Outreach"],
      ["Telehealth Support Training", "Hands-on training for volunteers assisting with the telehealth program.", "GHRI Training Center, Room 201", 14, 17, 15, "Training"],
      ["Back-to-School Wellness Day", "Annual back-to-school event with vision screenings, immunization info, and health kits.", "Riverside Park Pavilion", 21, 29, 30, "Health Fair"],
    ];
    for (const [title, desc, location, startDayOffset, endHourOffset, maxVol, category] of events) {
      const startTime = new Date(now.getTime() + Number(startDayOffset) * 24 * 60 * 60 * 1000);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(now.getTime() + Number(startDayOffset) * 24 * 60 * 60 * 1000);
      endTime.setHours(Number(endHourOffset), 0, 0, 0);
      await client.query(
        `INSERT INTO vol_events (title, description, location, start_time, end_time, max_volunteers, coordinator_id, status, category, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming', $8, NOW())`,
        [title, desc, location, startTime, endTime, maxVol, coordId, category]
      );
    }
    console.log("Created 5 events");
  } else {
    console.log("Events already exist");
  }

  await client.end();
  console.log("\n✅ Volunteer portal seeding complete!");
}

seed().catch(e => { console.error(e); process.exit(1); });
