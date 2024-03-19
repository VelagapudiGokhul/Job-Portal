const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/careerhub', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', () => console.error("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));

const Job = mongoose.model('Job', {
    jobID: String,
    jname: String,
    salary: Number,
    description: String,
    location: String
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/upload', upload.single('resume'), (req, res) => {
    const resumeFile = req.file;
    if (!resumeFile || resumeFile.mimetype !== 'application/pdf') {
        return res.status(400).send('Please upload a valid PDF file');
    }

    const resumeData = {
        resume: {
            data: resumeFile.buffer,
            contentType: resumeFile.mimetype
        }
    };

    mongoose.connection.db.collection('resumes').insertOne(resumeData, (err, result) => {
        if (err) {
            console.error('Error inserting document:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.sendStatus(200);
    });
});


app.post("/addJob", (req, res) => {
    const jobID = generateUniqueID();
    const { jname, salary, description, location } = req.body;

    const job = new Job({
        jobID,
        jname,
        salary,
        description,
        location
    });

    job.save()
        .then(() => {
            console.log("Record Inserted Successfully");
            res.redirect('/index.html');
        })
        .catch(err => {
            console.error("Error inserting job:", err);
            res.status(500).send("Error inserting job");
        });
});

app.get("/jobs", async (req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).send("Error fetching jobs");
    }
});

app.get("/", (req, res) => {
    res.redirect('admin.html');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function generateUniqueID() {
    let id = 'jb-';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 6;
    for (let i = 0; i < length; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

