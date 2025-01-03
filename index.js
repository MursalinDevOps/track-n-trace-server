require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Track n trace is on the right track and has trace :)");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mzx0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const database = client.db("lostItemsDB");
    const itemsCollection = database.collection("items");
    const recoveredItemsCollection = client
      .db("lostItemsDB")
      .collection("recoveredItems");
    //
    // Endpoint to create a new item data in the database
    app.post("/all-items", async (req, res) => {
      const addItemFormData = req.body;
      //   console.log(addItemFormData);
      const result = await itemsCollection.insertOne(addItemFormData);
      res.send(result);
    });

    // Endpoint to create api for all items
    app.get("/all-items", async (req, res) => {
      const cursor = itemsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // added endpoint to create api for a single item by ID
    app.get("/all-items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await itemsCollection.findOne(query);
      res.send(result);
    });
    // added endpoint to create api for a single item by User Email
    app.get("/all-items/email/:userEmail", async (req, res) => {
      const { userEmail } = req.params;
      const query = { email: userEmail };
      // console.log(userEmail, query)
      const result = await itemsCollection.find(query).toArray();
      res.send(result);
    });

    // PUT /all-items/:id API to update a campaign by ID
    app.put("/all-items/:id", async (req, res) => {
      const { id } = req.params;
      const updatedPost = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedItem = {
        $set: updatedPost,
      };
      const result = await itemsCollection.updateOne(query, updatedItem);
      res.send(result);
    });

     // DELETE a post 
     app.delete("/all-items/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await itemsCollection.deleteOne(query);
      res.send(result);
    });

    //
    app.post("/recover-item/:id", async (req, res) => {
      const { id } = req.params;
      const recoveryDetails = req.body;
      const item = await itemsCollection.findOne({ _id: new ObjectId(id) });

      if (item?.status === "recovered") {
        return res.status(400).send({ error: "Item is already recovered." });
      }

      const recoveryResult = await recoveredItemsCollection.insertOne({
        ...recoveryDetails,
        itemId: id,
      });

      const updateResult = await itemsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "recovered" } }
      );

      res.send({
        message: "Item marked as recovered.",
        recoveryResult,
        updateResult,
      });
    });

    app.get("/recovered-items", async (req, res) => {
      const result = await recoveredItemsCollection.find().toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on ${port} port`);
});
