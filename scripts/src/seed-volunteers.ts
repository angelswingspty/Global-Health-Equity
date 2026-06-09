import { db } from "@workspace/db";
import {
  volUsersTable,
  volTrainingResourcesTable,
  volWaiversTable,
  volEventsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  // Coordinator account
  const existing = await db.select({ id: volUsersTable.id }).from(volUsersTable).where(eq(volUsersTable.email, "coordinator@ghri.org")).limit(1);
  if (existing.length === 0) {
    const hash = await bcrypt.hash("Coord1234!", 12);
    await db.insert(volUsersTable).values({
      email: "coordinator@ghri.org",
      passwordHash: hash,
      name: "Dr. Amara Osei",
      avatarInitials: "AO",
      role: "coordinator",
      status: "active",
      skills: "Program Management, Training, Outreach",
      availability: "Mon-Fri",
      bio: "GHRI Volunteer Coordinator",
      consentedAt: new Date(),
    });
    console.log("Created coordinator: coordinator@ghri.org / Coord1234!");
  } else {
    console.log("Coordinator already exists");
  }

  // Demo volunteer
  const existingVol = await db.select({ id: volUsersTable.id }).from(volUsersTable).where(eq(volUsersTable.email, "volunteer@demo.ghri.org")).limit(1);
  if (existingVol.length === 0) {
    const hash = await bcrypt.hash("Demo1234!", 12);
    await db.insert(volUsersTable).values({
      email: "volunteer@demo.ghri.org",
      passwordHash: hash,
      name: "Jordan Lee",
      avatarInitials: "JL",
      role: "volunteer",
      status: "active",
      skills: "Community Outreach, First Aid",
      availability: "Weekends",
      consentedAt: new Date(),
    });
    console.log("Created demo volunteer: volunteer@demo.ghri.org / Demo1234!");
  } else {
    console.log("Demo volunteer already exists");
  }

  // Training resources
  const existingTraining = await db.select({ id: volTrainingResourcesTable.id }).from(volTrainingResourcesTable).limit(1);
  if (existingTraining.length === 0) {
    await db.insert(volTrainingResourcesTable).values([
      {
        title: "GHRI Mission & Values",
        description: "An introduction to GHRI Foundation's mission, vision, and core values for all new volunteers.",
        content: "# Welcome to GHRI Foundation\n\nGHRI Foundation is dedicated to providing equitable healthcare access to underserved communities worldwide.\n\n## Our Core Values\n- **Equity**: Every person deserves quality healthcare\n- **Integrity**: We operate with transparency and accountability\n- **Compassion**: We serve with empathy and respect\n- **Innovation**: We seek creative solutions to complex health challenges",
        resourceType: "article",
        durationMinutes: 15,
        required: true,
        sortOrder: 1,
      },
      {
        title: "HIPAA & Patient Privacy Training",
        description: "Mandatory HIPAA compliance training for all volunteers who may interact with patient information.",
        content: "# HIPAA Training for GHRI Volunteers\n\n## What is HIPAA?\nHIPAA protects patient health information (PHI).\n\n## Key Rules\n- Minimum Necessary: Only access the PHI needed to do your job\n- No Unauthorized Disclosure: Never share patient info without authorization\n- Secure Handling: Use secure channels for any PHI communication\n- Reporting: Report any suspected breach immediately to a coordinator",
        resourceType: "document",
        durationMinutes: 30,
        required: true,
        sortOrder: 2,
      },
      {
        title: "Cultural Competency in Healthcare",
        description: "Learn to provide culturally sensitive care and communication across diverse communities.",
        content: "# Cultural Competency Training\n\n## Why It Matters\nGHRI serves diverse communities across many cultures, languages, and belief systems.\n\n## Key Principles\n- Self-Awareness: Understand your own cultural biases\n- Knowledge: Learn about the communities you serve\n- Skills: Adapt your communication style\n- Encounters: Apply cultural competency in every interaction",
        resourceType: "article",
        durationMinutes: 25,
        required: true,
        sortOrder: 3,
      },
      {
        title: "Emergency Procedures & Safety",
        description: "Critical safety procedures all volunteers must know before participating in any GHRI program.",
        content: "# Emergency Procedures\n\n## Medical Emergency\n1. Call 911 immediately\n2. Notify the nearest GHRI staff member\n3. Do not attempt medical interventions unless trained\n\n## Fire Evacuation\n1. Activate the nearest alarm\n2. Guide participants to exits\n3. Meet at the designated assembly point\n\n## Incident Reporting\nAll incidents must be reported within 24 hours.",
        resourceType: "document",
        durationMinutes: 20,
        required: true,
        sortOrder: 4,
      },
      {
        title: "Telehealth Technology Basics",
        description: "Introduction to the technology platforms and tools used in GHRI's telehealth programs.",
        content: "# Telehealth Technology for Volunteers\n\n## Platforms We Use\n- GHRI Portal: For scheduling, messaging, and documentation\n- Jitsi Meet: For secure video consultations\n\n## Getting Started\n1. Set up your volunteer portal account\n2. Test your camera and microphone before any video session\n3. Use a private, quiet location for telehealth sessions",
        resourceType: "video",
        url: "https://meet.jit.si",
        durationMinutes: 20,
        required: false,
        sortOrder: 5,
      },
      {
        title: "Community Health Outreach Best Practices",
        description: "Strategies and best practices for effective community health outreach events.",
        content: "# Community Health Outreach\n\n## Planning an Outreach Event\n1. Identify the target community and their specific health needs\n2. Partner with trusted community organizations\n3. Prepare multilingual materials\n\n## During the Event\n- Greet participants warmly and introduce yourself\n- Listen actively to community members' concerns\n- Provide accurate health information",
        resourceType: "article",
        durationMinutes: 30,
        required: false,
        sortOrder: 6,
      },
    ]);
    console.log("Created 6 training resources");
  } else {
    console.log("Training resources already exist");
  }

  // Waivers
  const existingWaivers = await db.select({ id: volWaiversTable.id }).from(volWaiversTable).limit(1);
  if (existingWaivers.length === 0) {
    await db.insert(volWaiversTable).values([
      {
        title: "Volunteer Participation Agreement",
        version: "v2.1",
        required: true,
        content: `GHRI FOUNDATION VOLUNTEER PARTICIPATION AGREEMENT

This Volunteer Participation Agreement is entered into between the volunteer and GHRI Foundation.

1. VOLUNTARY SERVICE
The Volunteer agrees to provide services voluntarily and without compensation. This Agreement does not create an employment relationship.

2. SCOPE OF SERVICE
The Volunteer agrees to:
- Follow all GHRI Foundation policies, procedures, and guidelines
- Attend required training sessions
- Maintain professional conduct at all times
- Report any concerns or incidents to a coordinator

3. CONFIDENTIALITY
The Volunteer agrees to maintain strict confidentiality regarding patient information, organizational information, and any proprietary data encountered during service.

4. HIPAA COMPLIANCE
The Volunteer acknowledges receipt of HIPAA training and agrees to comply with all HIPAA requirements, including the protection of Protected Health Information (PHI).

5. TERMINATION
Either party may terminate this agreement at any time. GHRI Foundation reserves the right to remove any volunteer for violation of this Agreement.

By signing this agreement, the Volunteer acknowledges that they have read, understood, and agree to be bound by these terms.`,
      },
      {
        title: "HIPAA Confidentiality Agreement",
        version: "v3.0",
        required: true,
        content: `GHRI FOUNDATION HIPAA CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This agreement is required for all volunteers who may have access to Protected Health Information (PHI).

1. DEFINITION OF PHI
Protected Health Information includes any information that relates to an individual's health condition and can be used to identify the individual.

2. PERMITTED USES
The Volunteer may use or disclose PHI only as necessary to perform authorized volunteer duties or as required by law.

3. PROHIBITED ACTIONS
The Volunteer shall NOT:
- Access PHI beyond what is necessary for their duties
- Discuss patient information in public areas
- Share login credentials with any other person

4. REPORTING BREACHES
Any actual or suspected breach of PHI must be reported immediately to the GHRI Privacy Officer at privacy@ghri.org.

5. CONSEQUENCES OF VIOLATION
Violation may result in removal from the volunteer program and civil/criminal penalties under HIPAA.

6. DURATION
The obligations under this agreement survive indefinitely after the end of volunteer service.`,
      },
      {
        title: "Liability Waiver and Release",
        version: "v1.5",
        required: true,
        content: `GHRI FOUNDATION VOLUNTEER LIABILITY WAIVER AND RELEASE

PLEASE READ THIS WAIVER CAREFULLY. BY SIGNING, YOU ARE AGREEING TO LIMIT YOUR LEGAL RIGHTS.

1. ASSUMPTION OF RISK
The Volunteer acknowledges that volunteer activities may involve certain risks, including physical injury, exposure to communicable diseases, and psychological stress. The Volunteer voluntarily assumes all such risks.

2. RELEASE OF LIABILITY
The Volunteer hereby releases, waives, and discharges GHRI Foundation, its officers, directors, employees, and agents from all liability arising from volunteer activities, except in cases of gross negligence or intentional misconduct.

3. MEDICAL AUTHORIZATION
In the event of an emergency, the Volunteer authorizes GHRI Foundation staff to seek emergency medical treatment on the Volunteer's behalf.

4. GOVERNING LAW
This waiver shall be governed by the laws of the jurisdiction in which GHRI Foundation is incorporated.`,
      },
      {
        title: "Social Media & Communication Policy",
        version: "v1.2",
        required: false,
        content: `GHRI FOUNDATION SOCIAL MEDIA AND COMMUNICATION POLICY FOR VOLUNTEERS

1. PURPOSE
This policy establishes guidelines for volunteers' use of social media as they relate to GHRI Foundation.

2. GENERAL PRINCIPLES
- Never share patient information on any social media platform
- Distinguish between personal opinions and official GHRI positions
- Be respectful and professional in all online communications

3. AUTHORIZED SHARING
Volunteers MAY share publicly available GHRI announcements, events, and general mission information.

4. PROHIBITED CONTENT
Volunteers may NOT share patient information or photos, internal disputes, or anything that could damage GHRI's reputation.

5. MEDIA INQUIRIES
All media inquiries must be referred to GHRI's communications team at communications@ghri.org.`,
      },
    ]);
    console.log("Created 4 waivers");
  } else {
    console.log("Waivers already exist");
  }

  // Events
  const existingEvents = await db.select({ id: volEventsTable.id }).from(volEventsTable).limit(1);
  if (existingEvents.length === 0) {
    const now = new Date();
    const coord = await db.select({ id: volUsersTable.id }).from(volUsersTable).where(eq(volUsersTable.email, "coordinator@ghri.org")).limit(1);
    const coordId = coord[0]?.id ?? null;

    await db.insert(volEventsTable).values([
      {
        title: "Volunteer Orientation — New Cohort",
        description: "Welcome orientation for all new GHRI volunteers. Meet the team, learn about our programs, and get set up with your volunteer account.",
        location: "GHRI Main Office, Conference Room A",
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        maxVolunteers: 25,
        coordinatorId: coordId,
        status: "upcoming",
        category: "Orientation",
      },
      {
        title: "Community Health Fair — Eastside",
        description: "Join us for our quarterly community health fair providing free screenings, health education, and resource referrals to underserved residents.",
        location: "Eastside Community Center, 4500 MLK Blvd",
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        maxVolunteers: 20,
        coordinatorId: coordId,
        status: "upcoming",
        category: "Health Fair",
      },
      {
        title: "Senior Center Wellness Check",
        description: "Monthly wellness check visits to our partner senior living centers. Provide friendly companionship and basic health monitoring support.",
        location: "Sunrise Senior Living & Maplewood Terrace",
        startTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        maxVolunteers: 12,
        coordinatorId: coordId,
        status: "upcoming",
        category: "Outreach",
      },
      {
        title: "Telehealth Support Training",
        description: "Hands-on training session for volunteers assisting with our telehealth program. Learn to support patients with video appointments.",
        location: "GHRI Training Center, Room 201",
        startTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        maxVolunteers: 15,
        coordinatorId: coordId,
        status: "upcoming",
        category: "Training",
      },
      {
        title: "Back-to-School Wellness Day",
        description: "Volunteer with us at our annual back-to-school event providing vision screenings, immunization information, and health kits to families.",
        location: "Riverside Park Pavilion",
        startTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        maxVolunteers: 30,
        coordinatorId: coordId,
        status: "upcoming",
        category: "Health Fair",
      },
    ]);
    console.log("Created 5 events");
  } else {
    console.log("Events already exist");
  }

  console.log("\n✅ Volunteer portal seeding complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
