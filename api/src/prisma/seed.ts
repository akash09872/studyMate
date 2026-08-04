import { PrismaClient, Role, BadgeRarity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding StudyMate database...');

  // ─── Branches ──────────────────────────────────────────────────────────────
  const branches = await Promise.all([
    prisma.branch.upsert({ where: { shortName: 'CSE' }, update: {}, create: { name: 'Computer Science & Engineering', shortName: 'CSE', description: 'Core CS curriculum' } }),
    prisma.branch.upsert({ where: { shortName: 'IT' }, update: {}, create: { name: 'Information Technology', shortName: 'IT', description: 'IT and software systems' } }),
    prisma.branch.upsert({ where: { shortName: 'ECE' }, update: {}, create: { name: 'Electronics & Communication', shortName: 'ECE', description: 'Electronics and signals' } }),
    prisma.branch.upsert({ where: { shortName: 'ME' }, update: {}, create: { name: 'Mechanical Engineering', shortName: 'ME', description: 'Mechanical systems' } }),
    prisma.branch.upsert({ where: { shortName: 'CE' }, update: {}, create: { name: 'Civil Engineering', shortName: 'CE', description: 'Civil and structural' } }),
  ]);
  console.log(`✅ ${branches.length} branches created`);

  // ─── Semesters for each branch ─────────────────────────────────────────────
  for (const branch of branches) {
    for (let i = 1; i <= 8; i++) {
      await prisma.semester.upsert({
        where: { number_branchId: { number: i, branchId: branch.id } },
        update: {},
        create: { number: i, branchId: branch.id },
      });
    }
  }
  console.log('✅ Semesters created');

  // ─── Subjects ─────────────────────────────────────────────────────────────
  const cseBranch = branches[0];
  const sem1 = await prisma.semester.findFirst({ where: { number: 1, branchId: cseBranch.id } });
  const sem2 = await prisma.semester.findFirst({ where: { number: 2, branchId: cseBranch.id } });
  const sem3 = await prisma.semester.findFirst({ where: { number: 3, branchId: cseBranch.id } });
  const sem4 = await prisma.semester.findFirst({ where: { number: 4, branchId: cseBranch.id } });

  const subjectData = [
    { name: 'Mathematics I', code: 'MA101', branchId: cseBranch.id, semesterId: sem1!.id, credits: 4 },
    { name: 'Engineering Physics', code: 'PH101', branchId: cseBranch.id, semesterId: sem1!.id, credits: 4 },
    { name: 'Programming in C', code: 'CS101', branchId: cseBranch.id, semesterId: sem1!.id, credits: 3 },
    { name: 'Engineering Chemistry', code: 'CH101', branchId: cseBranch.id, semesterId: sem1!.id, credits: 4 },
    { name: 'Mathematics II', code: 'MA201', branchId: cseBranch.id, semesterId: sem2!.id, credits: 4 },
    { name: 'Data Structures', code: 'CS201', branchId: cseBranch.id, semesterId: sem2!.id, credits: 4 },
    { name: 'Digital Electronics', code: 'CS202', branchId: cseBranch.id, semesterId: sem2!.id, credits: 3 },
    { name: 'Discrete Mathematics', code: 'MA301', branchId: cseBranch.id, semesterId: sem3!.id, credits: 4 },
    { name: 'Design and Analysis of Algorithms', code: 'CS301', branchId: cseBranch.id, semesterId: sem3!.id, credits: 4 },
    { name: 'Object Oriented Programming', code: 'CS302', branchId: cseBranch.id, semesterId: sem3!.id, credits: 4 },
    { name: 'Database Management Systems', code: 'CS401', branchId: cseBranch.id, semesterId: sem4!.id, credits: 4 },
    { name: 'Operating Systems', code: 'CS402', branchId: cseBranch.id, semesterId: sem4!.id, credits: 4 },
    { name: 'Computer Networks', code: 'CS403', branchId: cseBranch.id, semesterId: sem4!.id, credits: 4 },
  ];

  for (const sub of subjectData) {
    await prisma.subject.upsert({ where: { code: sub.code }, update: {}, create: sub });
  }
  console.log(`✅ ${subjectData.length} subjects created`);

  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@studymate.com' },
    update: {},
    create: {
      email: 'admin@studymate.com',
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Admin',
      collegeId: 'sysadmin',
      role: Role.ADMIN,
      emailVerified: true,
      totalPoints: 9999,
      level: 10,
    },
  });

  // ─── Faculty Users ─────────────────────────────────────────────────────────
  const facultyHash = await bcrypt.hash('Faculty@123', 12);
  const faculty1 = await prisma.user.upsert({
    where: { email: 'dr.sharma@studymate.com' },
    update: {},
    create: {
      email: 'dr.sharma@studymate.com',
      passwordHash: facultyHash,
      firstName: 'Dr. Rajesh',
      lastName: 'Sharma',
      collegeId: 'dr_sharma',
      role: Role.FACULTY,
      emailVerified: true,
      branchId: cseBranch.id,
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'prof.gupta@studymate.com' },
    update: {},
    create: {
      email: 'prof.gupta@studymate.com',
      passwordHash: facultyHash,
      firstName: 'Prof. Anita',
      lastName: 'Gupta',
      collegeId: 'prof_gupta',
      role: Role.FACULTY,
      emailVerified: true,
      branchId: cseBranch.id,
    },
  });

  // ─── Student Users ─────────────────────────────────────────────────────────
  const studentHash = await bcrypt.hash('Student@123', 12);
  const studentData = [
    { email: 'arjun@studymate.com', firstName: 'Arjun', lastName: 'Mehta', collegeId: 'arjun_mehta', points: 1250, level: 5 },
    { email: 'priya@studymate.com', firstName: 'Priya', lastName: 'Patel', collegeId: 'priya_patel', points: 980, level: 4 },
    { email: 'rahul@studymate.com', firstName: 'Rahul', lastName: 'Singh', collegeId: 'rahul_singh', points: 2100, level: 7 },
    { email: 'sneha@studymate.com', firstName: 'Sneha', lastName: 'Verma', collegeId: 'sneha_verma', points: 560, level: 3 },
    { email: 'karan@studymate.com', firstName: 'Karan', lastName: 'Kumar', collegeId: 'karan_kumar', points: 3200, level: 8 },
  ];

  const students = await Promise.all(
    studentData.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          firstName: s.firstName,
          lastName: s.lastName,
          collegeId: s.collegeId,
          passwordHash: studentHash,
          role: Role.STUDENT,
          emailVerified: true,
          branchId: cseBranch.id,
          currentSemester: 4,
          totalPoints: s.points,
          level: s.level,
          contributionScore: s.points,
        },
      })
    )
  );
  console.log(`✅ ${students.length} students created`);

  // Create notification prefs and default bookmark collections for each user
  for (const user of [...students, admin, faculty1, faculty2]) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    await prisma.bookmarkCollection.upsert({
      where: { name_userId: { name: 'Saved Resources', userId: user.id } },
      update: {},
      create: { userId: user.id, name: 'Saved Resources', isDefault: true },
    });
  }

  // ─── Badges ───────────────────────────────────────────────────────────────
  const badgeData = [
    { name: 'First Upload', description: 'Upload your first resource', iconUrl: '🚀', rarity: BadgeRarity.COMMON, criteria: { type: 'UPLOAD_COUNT', value: 1 }, points: 25 },
    { name: 'Contributor', description: 'Upload 5 resources', iconUrl: '📚', rarity: BadgeRarity.COMMON, criteria: { type: 'UPLOAD_COUNT', value: 5 }, points: 50 },
    { name: 'Knowledge Sharer', description: 'Upload 25 resources', iconUrl: '🎓', rarity: BadgeRarity.UNCOMMON, criteria: { type: 'UPLOAD_COUNT', value: 25 }, points: 150 },
    { name: 'Resource Guru', description: 'Upload 100 resources', iconUrl: '🏆', rarity: BadgeRarity.RARE, criteria: { type: 'UPLOAD_COUNT', value: 100 }, points: 500 },
    { name: 'Rising Star', description: 'Earn 500 XP', iconUrl: '⭐', rarity: BadgeRarity.COMMON, criteria: { type: 'POINT_COUNT', value: 500 }, points: 50 },
    { name: 'Scholar', description: 'Earn 2000 XP', iconUrl: '🌟', rarity: BadgeRarity.UNCOMMON, criteria: { type: 'POINT_COUNT', value: 2000 }, points: 100 },
    { name: 'Legend', description: 'Earn 10000 XP', iconUrl: '👑', rarity: BadgeRarity.LEGENDARY, criteria: { type: 'POINT_COUNT', value: 10000 }, points: 1000 },
  ];

  for (const badge of badgeData) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`✅ ${badgeData.length} badges created`);

  // ─── Sample Resources ──────────────────────────────────────────────────────
  const subjects = await prisma.subject.findMany({ where: { branchId: cseBranch.id } });
  const resourceSamples = [
    { title: 'Data Structures Complete Notes', type: 'NOTES' as const, subject: 'CS201', unit: '1' },
    { title: 'DBMS PYQ 2023', type: 'PYQ' as const, subject: 'CS401', unit: '2' },
    { title: 'Operating Systems Lab Manual', type: 'LAB_MANUAL' as const, subject: 'CS402', unit: '3' },
    { title: 'Computer Networks PPT Unit 1', type: 'PPT' as const, subject: 'CS403', unit: '1' },
    { title: 'Algorithm Design Cheat Sheet', type: 'CHEAT_SHEET' as const, subject: 'CS301', unit: '4' },
  ];

  for (const rs of resourceSamples) {
    const subject = subjects.find((s) => s.code === rs.subject);
    if (!subject) continue;
    const slug = rs.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

    await prisma.resource.create({
      data: {
        title: rs.title,
        slug,
        description: `Comprehensive ${rs.type.toLowerCase().replace('_', ' ')} for ${rs.title}. Covers all important topics.`,
        type: rs.type,
        status: 'APPROVED',
        fileUrl: '/uploads/files/sample.pdf',
        fileKey: 'sample.pdf',
        fileName: 'sample.pdf',
        fileSize: 1024000,
        fileType: 'application/pdf',
        subjectId: subject.id,
        branchId: cseBranch.id,
        semesterId: subject.semesterId,
        unit: rs.unit,
        uploaderId: students[0].id,
        reviewerId: faculty1.id,
        isVerified: true,
        isFeatured: true,
        reviewedAt: new Date(),
        viewCount: Math.floor(Math.random() * 500) + 50,
        downloadCount: Math.floor(Math.random() * 200) + 20,
        averageRating: 4 + Math.random(),
        ratingCount: Math.floor(Math.random() * 30) + 5,
        tags: {
          create: [
            { name: rs.type.toLowerCase() },
            { name: 'cse' },
            { name: subject.code.toLowerCase() },
          ],
        },
      },
    });
  }
  console.log(`✅ ${resourceSamples.length} sample resources created`);

  // ─── Challenges ────────────────────────────────────────────────────────────
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  await prisma.challenge.upsert({
    where: { id: 'weekly-upload-challenge' },
    update: {},
    create: {
      id: 'weekly-upload-challenge',
      title: 'Weekly Uploader',
      description: 'Upload 3 resources this week',
      type: 'WEEKLY',
      xpReward: 150,
      criteria: { type: 'UPLOADS', value: 3 },
      startDate: now,
      endDate: endOfWeek,
    },
  });

  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────');
  console.log('Test credentials:');
  console.log('  Admin:   admin@studymate.com / Admin@123');
  console.log('  Faculty: dr.sharma@studymate.com / Faculty@123');
  console.log('  Student: arjun@studymate.com / Student@123');
  console.log('─────────────────────────────\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
