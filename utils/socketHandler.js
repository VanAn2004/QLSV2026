let onlineUsers = new Map();

module.exports = {
    init: function (io) {
        io.on('connection', function (socket) {
            console.log('user connected: ' + socket.id);

            socket.on('register', function (userId) {
                onlineUsers.set(userId, socket.id);
                socket.join('notification_' + userId);
                console.log('user registered: ' + userId);
            });

            socket.on('join_class', function (courseClassId) {
                socket.join('class_' + courseClassId);
                console.log('user joined class: ' + courseClassId);
            });

            socket.on('disconnect', function () {
                for (let [userId, socketId] of onlineUsers) {
                    if (socketId === socket.id) {
                        onlineUsers.delete(userId);
                        break;
                    }
                }
                console.log('user disconnected: ' + socket.id);
            });
        });
    },
    getIO: function () {
        return global._io;
    }
}
