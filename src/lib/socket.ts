import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join role-based rooms
    socket.on('join-role', (role: string) => {
      socket.join(`role-${role}`);
      console.log(`User ${socket.id} joined room: role-${role}`);
    });

    // Join department-based rooms
    socket.on('join-department', (departmentId: string) => {
      socket.join(`department-${departmentId}`);
      console.log(`User ${socket.id} joined room: department-${departmentId}`);
    });

    // Handle timetable updates
    socket.on('timetable-update', (data: {
      action: 'created' | 'updated' | 'deleted';
      entry: any;
    }) => {
      // Broadcast to all users in the same department
      if (data.entry.departmentId) {
        io.to(`department-${data.entry.departmentId}`).emit('timetable-changed', {
          action: data.action,
          entry: data.entry,
          timestamp: new Date().toISOString()
        });
      }
      
      // Also broadcast to all admins
      io.to('role-ADMIN').emit('timetable-changed', {
        action: data.action,
        entry: data.entry,
        timestamp: new Date().toISOString()
      });
    });

    // Handle emergency rescheduling
    socket.on('emergency-reschedule', (data: {
      date: string;
      reason: string;
      affectedEntries: number;
    }) => {
      // Broadcast emergency notification to all users
      io.emit('emergency-notification', {
        type: 'EMERGENCY_RESCHEDULE',
        date: data.date,
        reason: data.reason,
        affectedEntries: data.affectedEntries,
        timestamp: new Date().toISOString()
      });
    });

    // Handle faculty attendance updates
    socket.on('attendance-update', (data: {
      facultyId: string;
      action: 'checkin' | 'checkout';
      timestamp: string;
    }) => {
      // Broadcast to admins
      io.to('role-ADMIN').emit('attendance-changed', {
        facultyId: data.facultyId,
        action: data.action,
        timestamp: data.timestamp
      });
    });

    // Handle holiday updates
    socket.on('holiday-update', (data: {
      action: 'created' | 'updated' | 'deleted';
      holiday: any;
    }) => {
      // Broadcast to all users
      io.emit('holiday-changed', {
        action: data.action,
        holiday: data.holiday,
        timestamp: new Date().toISOString()
      });
    });

    // Handle NEP compliance updates
    socket.on('nep-compliance-update', (data: {
      facultyId: string;
      isCompliant: boolean;
      details: any;
    }) => {
      // Broadcast to admins
      io.to('role-ADMIN').emit('nep-compliance-changed', {
        facultyId: data.facultyId,
        isCompliant: data.isCompliant,
        details: data.details,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Smart Classroom Scheduler Real-time Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};