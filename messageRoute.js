import express from 'express'
import Message from './messageSchema.js'
const router = express.Router();

// Rota para enviar mensagem
router.post('/send', async (req, res) => {
    const { senderId, receiverId, content } = req.body;

    try {
        const newMessage = new Message({
            senderId: senderId,
            receiverId: receiverId,
            content,
            status: 'sent',
        });
        await newMessage.save();

        const receiverSocketId = userSockets[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Error sending message' });
    }
});

// Rota para buscar mensagens entre dois usuários
router.get('/:user1Id/:user2Id', async (req, res) => {
    const { user1Id, user2Id } = req.params;
    try {

        const messages = await Message.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id },
            ],
        });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

// Rota para marcar mensagens como "lidas"
router.post('/markAsRead', async (req, res) => {
    const { senderId, receiverId } = req.body;

    try {
        const updatedObjec = await Message.updateMany(
            { senderId: senderId, receiverId: receiverId, status: 'sent' },
            { status: 'read' }
        );
        res.status(200).send('Messages marked as read');
    } catch (error) {
        res.status(500).json({ error: 'Error marking messages as read' });
    }



});

export default router;