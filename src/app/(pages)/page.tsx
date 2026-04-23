import EventList from "../components/event-list/event-list";
import { MongoClient } from 'mongodb';

export default async function Home() {
  let events = [];
  const eventsSourceUrl = process.env.EVENTS_SOURCE_URL;
  if (eventsSourceUrl) {
    try {
      const response = await fetch(eventsSourceUrl, { next: { revalidate } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      events = await response.json();
    } catch (error) {
      console.error("Failed to fetch events from EVENTS_SOURCE_URL:", error);
    }
  }

  if (!events.length) {
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
  }

  return (
    <div className="min-h-screen px-3 py-4 md:px-6 md:py-5">
      <main className="mx-auto flex w-full max-w-6xl flex-col">
        <EventList events={events} />
      </main>
    </div>
  );
}
