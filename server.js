const express = require("express");
const mongoose = require("mongoose");
const Rooms = require("./dbRooms");
const Pusher = require("pusher");
const cors = require("cors");
const Messages = require("./dbMessages");

const app = express();
const port = process.env.PORT || 7000;

const pusher = new Pusher({
  appId: "1367972",
  key: "68dc7abea9878fdfe6de",
  secret: "9bf5607990dbed1d4e7b",
  cluster: "ap2",
  useTLS: true
});


app.use(express.json());

app.use(cors());

const dbUrl = "mongodb+srv://pra-tik_06:pratik123@cluster0.nwcyp.mongodb.net/WhatsChat-06";

mongoose.connect(dbUrl);

const db = mongoose.connection;

db.once("open", () => {
  console.log("MongoDB connected!!");

  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const roomDetails = change.fullDocument;
      pusher.trigger("room", "inserted", roomDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });

  const msgCollection = db.collection("messages");
  const changeStream1 = msgCollection.watch();

  changeStream1.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", messageDetails);
    } else {
      console.log("Not a expected event to trigger");
    }
  });
});

app.get("/", (req, res) => {
  return res.status(200).send("Api is working");
});

app.get("/room/:id", (req, res) => {
  Rooms.find({ _id: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data[0]);
    }
  });
});

app.get("/messages/:id", (req, res) => {
  Messages.find({ roomId: req.params.id }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.post("/group/create", (req, res) => {
  const name = req.body.groupName;
  Rooms.create({ name }, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/all/rooms", (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on localhost:${port}`);
});