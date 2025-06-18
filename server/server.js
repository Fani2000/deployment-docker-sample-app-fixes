import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import slackChannelModel from './roomModel.js';
import userModel from './userModel.js';
import slackMessageModel from './messageModel.js';
import cors from 'cors';

const app = express();
const port = 9000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

// DB Config
const dbName = process.env.DB_NAME ?? 'slackchannels';
const hostName = process.env.DB_HOSTNAME ?? 'db';

const connection = `mongodb://${hostName}:27017/${dbName}`;

mongoose.connect(connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('successfully connected to the database');
}).catch(err => {
    console.log('error connecting to the database');
    console.log(err);
    process.exit();
});

// Routes
app.get('/', (req, res) => {
    console.log('connecting to route route "/"');
    res.status(200).send('Slack Clone');
});

app.post('/login', async (req, res) => {
    try {
        const requestData = req.body;
        // Search for existing user
        const existingUser = await userModel.findOne(requestData);

        if (existingUser) {
            console.log('Found user!!!!!!');
            console.log(existingUser);
            return res.status(201).send(existingUser);
        }

        // If user doesn't exist, create new user
        console.log('data was null user does not exist in db: creating');
        const user = {
            email: req.body.email,
            password: req.body.password,
            userImage: req.body.userImage
        };
        console.log(user);

        const newUser = new userModel(user);
        await newUser.save();

        console.log(`User ${JSON.stringify(user)} has been registered`);
        return res.status(202).send(user);

    } catch (err) {
        console.error('Error:', err);
        return res.status(400).send(err);
    }
});

app.get('/v1/channels/', async (req, res) => {
    try {
        console.log('connecting to route route "/channels"');
        const data = await slackChannelModel.find();
        console.log(typeof(data));
        console.log(data);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.get('/v1/channels/find', async (req, res) => {
    try {
        const data = await slackChannelModel.find();
        console.log(typeof(data));
        console.log(data);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.post('/v1/channels/add', async (req, res) => {
    try {
        const newChannel = req.body;
        const data = await slackChannelModel.create(newChannel);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});
app.post('/v1/channels/getChannelDetail', async (req, res) => {
    try {
        const requestData = req.body;
        const data = await slackChannelModel.findOne(requestData);
        if (data) {
            console.log(`${data} retrieved from the database`);
            return res.status(201).send(data);
        } else {
            console.log('No data found');
            return res.status(404).send({ message: 'Channel not found' });
        }
    } catch (err) {
        console.log('There was an error locating data');
        console.error(err);
        return res.status(500).send(err);
    }
});

app.post('/newMessage', async (req, res) => {
    try {
        const messageContent = {
            message: req.body.message,
            timeStamp: req.body.timeStamp,
            user: req.body.user,
            userImage: req.body.userImage,
            channelId: req.body.channelId
        };

        const newMessage = new slackMessageModel(messageContent);
        await newMessage.save();
        
        console.log(`${JSON.stringify(messageContent)} has been saved successfully`);
        return res.status(202).send(messageContent);
    } catch (err) {
        console.error('Error saving message:', err);
        return res.status(400).send(err);
    }
});

app.post('/v1/channels/findMessage', async (req, res) => {
    try {
        const data = await slackMessageModel.find();
        console.log(typeof(data));
        console.log(data);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.get('/v1/channels/findMessage/:roomID', async (req, res) => {
    try {
        const roomID = req.params.roomID;
        const query = {
            channelId: roomID
        };
        
        const data = await slackMessageModel.find(query);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

// Messages routes
app.get('/v1/messages/sync', async (req, res) => {
    try {
        const data = await slackMessageModel.find();
        return res.status(200).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.post('/v1/messages/new', async (req, res) => {
    try {
        const dbMessage = req.body;
        const data = await slackMessageModel.create(dbMessage);
        return res.status(201).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.get('/v1/messages/:channelId', async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const data = await slackMessageModel.find({ channelId: channelId });
        return res.status(200).send(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

// Delete routes
app.delete('/v1/channels/:channelId', async (req, res) => {
    try {
        const channelId = req.params.channelId;
        await slackChannelModel.deleteOne({ _id: channelId });
        return res.status(200).send({ message: 'Channel deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

app.delete('/v1/messages/:messageId', async (req, res) => {
    try {
        const messageId = req.params.messageId;
        await slackMessageModel.deleteOne({ _id: messageId });
        return res.status(200).send({ message: 'Message deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
