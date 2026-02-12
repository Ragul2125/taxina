const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDatabase = require('../src/config/database');
const User = require('../src/models/User');
const Ride = require('../src/models/Ride');
const ChatSession = require('../src/models/ChatSession');
const Message = require('../src/models/Message');
const AdminQuestion = require('../src/models/AdminQuestion');
const logger = require('../src/utils/logger');

/**
 * Seed Database with Dummy Data
 */
const seedDatabase = async () => {
    try {
        // Connect to database
        await connectDatabase();

        logger.info('🌱 Starting database seeding...');

        // Clear existing data
        logger.info('Clearing existing data...');
        await User.deleteMany({});
        await Ride.deleteMany({});
        await ChatSession.deleteMany({});
        await Message.deleteMany({});
        await AdminQuestion.deleteMany({});
        logger.success('✓ Existing data cleared');

        // Hash password for all users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 1. Create Users
        logger.info('Creating users...');

        const admin = await User.create({
            name: 'Admin User',
            phone: '9999999999',
            password: hashedPassword,
            role: 'ADMIN',
            isOnline: true
        });

        const customer1 = await User.create({
            name: 'Alice Customer',
            phone: '1111111111',
            password: hashedPassword,
            role: 'CUSTOMER',
            isOnline: true
        });

        const customer2 = await User.create({
            name: 'Bob Customer',
            phone: '2222222222',
            password: hashedPassword,
            role: 'CUSTOMER',
            isOnline: false
        });

        const driver1 = await User.create({
            name: 'Charlie Driver',
            phone: '3333333333',
            password: hashedPassword,
            role: 'DRIVER',
            isOnline: true
        });

        const driver2 = await User.create({
            name: 'David Driver',
            phone: '4444444444',
            password: hashedPassword,
            role: 'DRIVER',
            isOnline: true
        });

        logger.success(`✓ Created ${5} users`);

        // 2. Create Admin Questions
        logger.info('Creating admin questions...');

        const questions = await AdminQuestion.create([
            {
                questionText: 'What is your ETA?',
                answers: ['5 minutes', '10 minutes', '15 minutes', '20 minutes'],
                isActive: true,
                category: 'Timing',
                priority: 10
            },
            {
                questionText: 'Where are you right now?',
                answers: ['On my way', 'Nearby', 'Stuck in traffic', 'At pickup location'],
                isActive: true,
                category: 'Location',
                priority: 9
            },
            {
                questionText: 'Can you wait for 5 minutes?',
                answers: ['Yes, no problem', 'Yes, but please hurry', 'No, sorry'],
                isActive: true,
                category: 'General',
                priority: 8
            },
            {
                questionText: 'Do you have the correct address?',
                answers: ['Yes', 'No, please share again', 'I will call you'],
                isActive: true,
                category: 'Location',
                priority: 7
            },
            {
                questionText: 'Is the AC working?',
                answers: ['Yes', 'No', 'I will turn it on'],
                isActive: false,
                category: 'Comfort',
                priority: 5
            }
        ]);

        logger.success(`✓ Created ${questions.length} admin questions`);

        // 3. Create Rides
        logger.info('Creating rides...');

        // Ride 1: BOOKED (not started yet)
        const ride1 = await Ride.create({
            passengerId: customer1._id,
            driverId: driver1._id,
            status: 'BOOKED',
            pickupLocation: {
                type: 'Point',
                coordinates: [77.5946, 12.9716], // Bangalore
                address: '123 MG Road, Bangalore'
            },
            dropoffLocation: {
                type: 'Point',
                coordinates: [77.6408, 12.9698],
                address: '456 Indiranagar, Bangalore'
            },
            fare: 250
        });

        // Ride 2: STARTED (active ride with chat)
        const ride2 = await Ride.create({
            passengerId: customer1._id,
            driverId: driver2._id,
            status: 'STARTED',
            startedAt: new Date(Date.now() - 15 * 60 * 1000), // Started 15 mins ago
            pickupLocation: {
                type: 'Point',
                coordinates: [77.5946, 12.9716],
                address: '789 Koramangala, Bangalore'
            },
            dropoffLocation: {
                type: 'Point',
                coordinates: [77.7172, 13.0475],
                address: '321 Whitefield, Bangalore'
            },
            fare: 450
        });

        // Ride 3: ENDED (completed ride)
        const ride3 = await Ride.create({
            passengerId: customer2._id,
            driverId: driver1._id,
            status: 'ENDED',
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
            endedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Ended 1 hour ago
            pickupLocation: {
                type: 'Point',
                coordinates: [77.5946, 12.9716],
                address: 'Airport Road, Bangalore'
            },
            dropoffLocation: {
                type: 'Point',
                coordinates: [77.7172, 13.0475],
                address: 'Electronic City, Bangalore'
            },
            fare: 800
        });

        // Ride 4: STARTED (another active ride)
        const ride4 = await Ride.create({
            passengerId: customer2._id,
            driverId: driver2._id,
            status: 'STARTED',
            startedAt: new Date(Date.now() - 5 * 60 * 1000), // Started 5 mins ago
            pickupLocation: {
                type: 'Point',
                coordinates: [77.5946, 12.9716],
                address: 'HSR Layout, Bangalore'
            },
            dropoffLocation: {
                type: 'Point',
                coordinates: [77.6408, 12.9698],
                address: 'BTM Layout, Bangalore'
            },
            fare: 180
        });

        logger.success(`✓ Created ${4} rides`);

        // 4. Create Chat Sessions
        logger.info('Creating chat sessions...');

        // Chat for ride2 (active)
        const chat1 = await ChatSession.create({
            rideId: ride2._id,
            passengerId: customer1._id,
            driverId: driver2._id,
            status: 'ACTIVE',
            lastMessageAt: new Date(),
            messageCount: 8
        });

        // Chat for ride3 (closed)
        const chat2 = await ChatSession.create({
            rideId: ride3._id,
            passengerId: customer2._id,
            driverId: driver1._id,
            status: 'CLOSED',
            lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            messageCount: 5
        });

        // Chat for ride4 (active)
        const chat3 = await ChatSession.create({
            rideId: ride4._id,
            passengerId: customer2._id,
            driverId: driver2._id,
            status: 'ACTIVE',
            lastMessageAt: new Date(),
            messageCount: 3
        });

        logger.success(`✓ Created ${3} chat sessions`);

        // 5. Create Messages
        logger.info('Creating messages...');

        // Messages for chat1 (ride2)
        await Message.create([
            {
                chatSessionId: chat1._id,
                senderId: customer1._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Hello! I am waiting at the pickup location.',
                isRead: true,
                readAt: new Date(Date.now() - 14 * 60 * 1000),
                createdAt: new Date(Date.now() - 15 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: driver2._id,
                senderRole: 'DRIVER',
                type: 'TEXT',
                text: 'Hi! I am on my way. Will reach in 5 minutes.',
                isRead: true,
                readAt: new Date(Date.now() - 13 * 60 * 1000),
                createdAt: new Date(Date.now() - 14 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: customer1._id,
                senderRole: 'CUSTOMER',
                type: 'QUESTION',
                text: 'What is your ETA?',
                questionId: questions[0]._id,
                isRead: true,
                readAt: new Date(Date.now() - 12 * 60 * 1000),
                createdAt: new Date(Date.now() - 13 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: driver2._id,
                senderRole: 'DRIVER',
                type: 'ANSWER',
                text: '5 minutes',
                questionId: questions[0]._id,
                isRead: true,
                readAt: new Date(Date.now() - 11 * 60 * 1000),
                createdAt: new Date(Date.now() - 12 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: customer1._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Great! Thank you.',
                isRead: true,
                readAt: new Date(Date.now() - 10 * 60 * 1000),
                createdAt: new Date(Date.now() - 11 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: driver2._id,
                senderRole: 'DRIVER',
                type: 'VOICE',
                voiceUrl: '/uploads/voices/sample-voice-1.mp3',
                voiceDuration: 8,
                isRead: true,
                readAt: new Date(Date.now() - 8 * 60 * 1000),
                createdAt: new Date(Date.now() - 9 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: customer1._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'I can see your car now!',
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 60 * 1000)
            },
            {
                chatSessionId: chat1._id,
                senderId: driver2._id,
                senderRole: 'DRIVER',
                type: 'TEXT',
                text: 'Perfect! Coming to you.',
                isRead: false,
                createdAt: new Date(Date.now() - 1 * 60 * 1000)
            }
        ]);

        // Messages for chat2 (ride3 - ended)
        await Message.create([
            {
                chatSessionId: chat2._id,
                senderId: customer2._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Hi, I need to go to Electronic City.',
                isRead: true,
                readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                chatSessionId: chat2._id,
                senderId: driver1._id,
                senderRole: 'DRIVER',
                type: 'TEXT',
                text: 'Sure! On my way.',
                isRead: true,
                readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
                chatSessionId: chat2._id,
                senderId: customer2._id,
                senderRole: 'CUSTOMER',
                type: 'QUESTION',
                text: 'Where are you right now?',
                questionId: questions[1]._id,
                isRead: true,
                readAt: new Date(Date.now() - 90 * 60 * 1000),
                createdAt: new Date(Date.now() - 100 * 60 * 1000)
            },
            {
                chatSessionId: chat2._id,
                senderId: driver1._id,
                senderRole: 'DRIVER',
                type: 'ANSWER',
                text: 'At pickup location',
                questionId: questions[1]._id,
                isRead: true,
                readAt: new Date(Date.now() - 85 * 60 * 1000),
                createdAt: new Date(Date.now() - 90 * 60 * 1000)
            },
            {
                chatSessionId: chat2._id,
                senderId: customer2._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Thank you for the ride!',
                isRead: true,
                readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
            }
        ]);

        // Messages for chat3 (ride4)
        await Message.create([
            {
                chatSessionId: chat3._id,
                senderId: customer2._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Hello driver!',
                isRead: true,
                readAt: new Date(Date.now() - 4 * 60 * 1000),
                createdAt: new Date(Date.now() - 5 * 60 * 1000)
            },
            {
                chatSessionId: chat3._id,
                senderId: driver2._id,
                senderRole: 'DRIVER',
                type: 'TEXT',
                text: 'Hello! I have arrived.',
                isRead: true,
                readAt: new Date(Date.now() - 3 * 60 * 1000),
                createdAt: new Date(Date.now() - 4 * 60 * 1000)
            },
            {
                chatSessionId: chat3._id,
                senderId: customer2._id,
                senderRole: 'CUSTOMER',
                type: 'TEXT',
                text: 'Coming down now.',
                isRead: false,
                createdAt: new Date(Date.now() - 2 * 60 * 1000)
            }
        ]);

        logger.success(`✓ Created ${16} messages`);

        // Summary
        logger.success('\n✅ Database seeding completed successfully!\n');

        console.log('📊 SUMMARY:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`👥 Users: ${5}`);
        console.log(`   - Admin: 1 (phone: 9999999999)`);
        console.log(`   - Customers: 2 (phones: 1111111111, 2222222222)`);
        console.log(`   - Drivers: 2 (phones: 3333333333, 4444444444)`);
        console.log(`   - Password for all: password123`);
        console.log('');
        console.log(`❓ Admin Questions: ${questions.length} (${questions.filter(q => q.isActive).length} active)`);
        console.log('');
        console.log(`🚗 Rides: ${4}`);
        console.log(`   - BOOKED: 1`);
        console.log(`   - STARTED: 2 (active chats)`);
        console.log(`   - ENDED: 1`);
        console.log('');
        console.log(`💬 Chat Sessions: ${3}`);
        console.log(`   - ACTIVE: 2`);
        console.log(`   - CLOSED: 1`);
        console.log('');
        console.log(`📨 Messages: ${16}`);
        console.log(`   - TEXT: 12`);
        console.log(`   - QUESTION: 3`);
        console.log(`   - ANSWER: 3`);
        console.log(`   - VOICE: 1`);
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('🔑 LOGIN CREDENTIALS:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Admin:');
        console.log('  Phone: 9999999999');
        console.log('  Password: password123');
        console.log('');
        console.log('Customer 1 (Alice):');
        console.log('  Phone: 1111111111');
        console.log('  Password: password123');
        console.log('');
        console.log('Customer 2 (Bob):');
        console.log('  Phone: 2222222222');
        console.log('  Password: password123');
        console.log('');
        console.log('Driver 1 (Charlie):');
        console.log('  Phone: 3333333333');
        console.log('  Password: password123');
        console.log('');
        console.log('Driver 2 (David):');
        console.log('  Phone: 4444444444');
        console.log('  Password: password123');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('🎯 QUICK TEST IDs:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Admin ID: ${admin._id}`);
        console.log(`Customer 1 ID: ${customer1._id}`);
        console.log(`Driver 1 ID: ${driver1._id}`);
        console.log(`Ride 1 ID (BOOKED): ${ride1._id}`);
        console.log(`Ride 2 ID (STARTED): ${ride2._id}`);
        console.log(`Ride 3 ID (ENDED): ${ride3._id}`);
        console.log(`Question 1 ID: ${questions[0]._id}`);
        console.log(`Chat Session 1 ID: ${chat1._id}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        process.exit(0);

    } catch (error) {
        logger.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();
