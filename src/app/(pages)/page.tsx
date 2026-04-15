import EventList from "../components/event-list/event-list";
import { MongoClient } from 'mongodb';

export const revalidate = 86400; // Trigger background revalidation on Vercel every 24 hours (86400 seconds)

export default async function Home() {
  let events = [];
  try {
    const uri = process.env.MONGODB_URI;
    if (uri) {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db();
      const docs = await db.collection('events').find({}).toArray();
      console.log(`Successfully fetched ${docs.length} events from MongoDB`);
      events = JSON.parse(JSON.stringify(docs));
      await client.close();
    } else {
      console.error("MONGODB_URI is not defined.");
    }
  } catch (error) {
    console.error("Failed to fetch events from MongoDB:", error);
  }

  return (
    <div className="items-center justify-items-center min-h-screen p-6 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center">
        <EventList events={events} />
      </main>
    </div>
  );
}
