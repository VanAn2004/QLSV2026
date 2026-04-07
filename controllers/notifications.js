let notificationModel = require('../schemas/notifications')
module.exports = {
    CreateANotification: async function (user, title, content) {
        let newItem = new notificationModel({
            user: user,
            title: title,
            content: content
        });
        await newItem.save();
        return newItem;
    },
    FindNotificationsByUser: async function (userId) {
        return await notificationModel.find({
            user: userId,
            isDeleted: false
        }).sort({ createdAt: -1 })
    },
    FindUnreadByUser: async function (userId) {
        return await notificationModel.find({
            user: userId,
            isRead: false,
            isDeleted: false
        }).sort({ createdAt: -1 })
    }
}
