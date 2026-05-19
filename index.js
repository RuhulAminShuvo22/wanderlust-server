const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const cors = require("cors");

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("wanderlust");

    const destinationCollection = db.collection("destinations");

    const bookingCollection = db.collection("bookings");

    //get API
    app.get("/destination", async (req, res) => {
      const result = await destinationCollection.find().toArray();
      res.json(result);
    });

    // POST API
    app.post("/destination", async (req, res) => {
      const destination = req.body;

      console.log(destination);

      const result = await destinationCollection.insertOne(destination);

      res.json(result);
    });

    //find one API  && middleware
    app.get("/destination/:id",
      // প্রথম ফাংশন: মিডলওয়্যার (এখানে next লাগবে)
      (req, res, next) => {
        const header = req.headers.authorization;
          console.log(header)
          next();
        
        // এটি পরের async ফাংশনটিকে চালু করবে
      },

      async (req, res) => {
        const { id } = req.params;
        const result = await destinationCollection.findOne({
          _id: new ObjectId(id),
        });
        res.json(result);
      },
    );

    // edit description related API
    app.patch("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await destinationCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json(result);
    });

    // for DELETE API
    app.delete("/destination/:id", async (req, res) => {
      const { id } = req.params;
      const result = await destinationCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    //for my-bookings API
    app.get("/booking/:userId", async (req, res) => {
      try {
        const { userId } = req.params;

        // Fixed the variable casing and correctly chained .toArray()
        const result = await bookingCollection
          .find({ userID: userId })
          .toArray();

        res.json(result);
      } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ error: "Failed to fetch bookings" });
      }
    });

    // for booking collection API
    app.post("/booking", async (req, res) => {
      try {
        const bookingData = req.body;

        //  Added missing await here
        const result = await bookingCollection.insertOne(bookingData);

        res.json(result);
      } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: "Failed to insert booking data" });
      }
    });

    app.delete("/booking/:bookingId", async (req, res) => {
      try {
        const { bookingId } = req.params;

        const result = await bookingCollection.deleteOne({
          _id: new ObjectId(bookingId),
        });
        res.json(result);
      } catch (error) {
        console.error("Delete booking error:", error);
        res.status(400).json({ error: "Invalid Booking ID or Server Error" });
      }
    });

    // MongoDB Ping
    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

// Server Listen
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
