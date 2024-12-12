import Notification from "../models/notification.js";

export const getNotifications = async (req,res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({to: userId}).populate({
            path: 'from',
            select: "username p rofileImg"
        })

        await Notification.updateMany({to: userId}, {read: true});
        res.status(200).json(notifications);
    } catch (err) {
        console.log("Error in getNotifications controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const deleteNotifications = async (req,res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.deleteMany({to: userId});
        res.status(200).json({message: 'Notifications deleted successfully'});
    } catch (err) {
        console.log("Error in deleteNotifications controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const deleteNotification = async (req,res) => {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const notification = await Notification.findById(id);
        if(!notification) return res.status(404).json({message: "Notification not found"});
        if(notification.to.toString() !== userId.toString()) return res.status(403).json({message: "You don't have access to delete this notification."})
        await Notification.findByIdAndDelete(id);
        res.status(200).json({message: 'Notification deleted successfully'});
    } catch (err) {
        console.log("Error in deleteNotification controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}