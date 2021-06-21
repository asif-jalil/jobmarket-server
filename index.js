const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qv7f2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
console.log();
const port = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

app.get("/", (req, res) => {
    res.send("Job Market Is Running");
});

// client api
client.connect((err) => {
    const jobs = client.db("jobMarket").collection("jobs");
    const admins = client.db("jobMarket").collection("admins");
    const employees = client.db("jobMarket").collection("employees");
    const seekers = client.db("jobMarket").collection("seekers");
    const empPackage = client.db("jobMarket").collection("empPackage");
    const applications = client.db("jobMarket").collection("applications");
    console.log(err);

    app.post("/check-admin", (req, res) => {
        const email = req.body.email;
        admins.find({ email }).toArray((err, doc) => {
            res.send(doc.length > 0);
        });
    });

    app.post("/check-employee", (req, res) => {
        const email = req.body.email;
        employees.find({ email }).toArray((err, doc) => {
            res.send(doc.length > 0);
        });
    });

    app.post("/check-seeker", (req, res) => {
        const email = req.body.email;
        seekers.find({ email }).toArray((err, doc) => {
            res.send(doc.length > 0);
        });
    });

    app.post("/add-admin", (req, res) => {
        const admin = req.body;
        const email = req.body.email;
        admins.find({ email: email }).toArray((err, doc) => {
            if ((doc.length > 0)) {
                res.send(false);
            } else {
                employees.find({ email: email }).toArray((err, doc) => {
                    if (doc.length > 0) {
                        res.send(false);
                    } else {
                        seekers.find({ email: email }).toArray((err, doc) => {
                            if (doc.length > 0) {
                                res.send(false)
                            } else {
                                admins.insertOne(admin).then((result) => {
                                    res.send(result.insertedCount > 0);
                                });                
                            }
                        })
                    }
                })
                
            }
        });
    });

    app.post("/signup-employee", (req, res) => {
        const employee = req.body;
        const email = req.body.email;
        employees.find({ email: email }).toArray((err, doc) => {
            console.log(doc);
            if ((doc.length > 0)) {
                res.send(false);
            } else {
                employees.insertOne(employee).then((result) => {
                    res.send(result.insertedCount > 0);
                });
            }
        });
    });

    app.post("/employee-package", (req, res) => {
        const package = req.body;
        empPackage.insertOne(package).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    app.post("/signup-seeker", (req, res) => {
        const seeker = req.body;
        const email = req.body.email;
        seekers.find({ email }).toArray((err, doc) => {
            if ((doc.length > 0)) {
                res.send(false);
            } else {
                seekers.insertOne(seeker).then((result) => {
                    res.send(result.insertedCount > 0);
                });
            }
        });
    });

    app.get("/employees", (req, res) => {
        employees.find({}).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.get("/seekers", (req, res) => {
        seekers.find({}).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.post("/add-job", (req, res) => {
        const job = req.body;
        jobs.insertOne(job).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    app.get("/jobs", (req, res) => {
        jobs.find({}).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.get("/approvedJobs", (req, res) => {
        jobs.find({ status: "approved" }).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.get("/jobsByEmail/:email", (req, res) => {
        const email = req.params.email;
        jobs.find({ email }).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.get("/jobById/:jobId", (req, res) => {
        const jobId = req.params.jobId;
        jobs.find({ _id: ObjectID(jobId) }).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.post("/new-application", (req, res) => {
        const application = req.body;
        applications.insertOne(application).then((result) => {
            res.send(result.insertedCount > 0);
        });
    });

    app.get("/applications", (req, res) => {
        applications.find({}).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.post("/application-by-seeker", (req, res) => {
        const email = req.body.email;
        applications
            .find({ "applicationInfo.email": email })
            .toArray((err, doc) => {
                res.send(doc);
            });
    });

    app.post("/application-by-employee", (req, res) => {
        const email = req.body.email;
        applications.find({ "jobInfo.email": email }).toArray((err, doc) => {
            res.send(doc);
        });
    });

    app.patch("/statusUpdate/:id", (req, res) => {
        const stat = req.query.status;
        const id = req.params.id;
        jobs.updateOne({ _id: ObjectID(id) }, { $set: { status: stat } }).then(
            (result) => {
                res.send(result.modifiedCount > 0);
            }
        );
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
