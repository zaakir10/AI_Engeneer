import "dotenv/config";
import { connectDB } from "./db";
import Movie from "./models/Movie";
import User from "./models/User";
import Review from "./models/Review";
import Joke from "./models/Joke";
import { localJokes } from "../data/localJokes";
import mongoose from "mongoose";

async function seed() {
  await connectDB();
  console.log("Connected. Clearing existing collections...");

  await Promise.all([
    Movie.deleteMany({}),
    User.deleteMany({}),
    Review.deleteMany({}),
    Joke.deleteMany({}),
  ]);

  const movies = await Movie.insertMany([
    { title: "Dune", year: 2021, genre: ["sci-fi", "adventure"], rating: 8.0, director: "Denis Villeneuve", description: "A noble family becomes embroiled in a war for control of a desert planet." },
    { title: "Interstellar", year: 2014, genre: ["sci-fi", "drama"], rating: 8.7, director: "Christopher Nolan", description: "Explorers travel through a wormhole in search of a new home for humanity." },
    { title: "Blade Runner 2049", year: 2017, genre: ["sci-fi", "thriller"], rating: 8.0, director: "Denis Villeneuve", description: "A young blade runner unearths a secret that could plunge society into chaos." },
    { title: "The Godfather", year: 1972, genre: ["crime", "drama"], rating: 9.2, director: "Francis Ford Coppola", description: "The aging patriarch of an organized crime dynasty transfers control to his son." },
    { title: "Parasite", year: 2019, genre: ["drama", "thriller"], rating: 8.6, director: "Bong Joon-ho", description: "Greed and class discrimination threaten a newly formed symbiotic relationship." },
    { title: "The Grand Budapest Hotel", year: 2014, genre: ["comedy", "drama"], rating: 8.1, director: "Wes Anderson", description: "A concierge and his lobby boy become involved in a murder mystery." },
    { title: "Whiplash", year: 2014, genre: ["drama", "music"], rating: 8.5, director: "Damien Chazelle", description: "A young drummer is pushed to his limits by a ruthless instructor." },
    { title: "Arrival", year: 2016, genre: ["sci-fi", "drama"], rating: 7.9, director: "Denis Villeneuve", description: "A linguist works to communicate with alien visitors." },
  ]);

  const users = await User.insertMany([
    { name: "Amina Farah", email: "amina@example.com", age: 28, favoriteGenre: "sci-fi" },
    { name: "Yusuf Ali", email: "yusuf@example.com", age: 34, favoriteGenre: "drama" },
    { name: "Hodan Warsame", email: "hodan@example.com", age: 22, favoriteGenre: "comedy" },
    { name: "Omar Jama", email: "omar@example.com", age: 41, favoriteGenre: "crime" },
  ]);

  await Review.insertMany([
    { movieId: movies[0]._id, userId: users[0]._id, rating: 9, comment: "Visually stunning.", date: new Date() },
    { movieId: movies[1]._id, userId: users[1]._id, rating: 10, comment: "A masterpiece.", date: new Date() },
    { movieId: movies[3]._id, userId: users[3]._id, rating: 10, comment: "The best film ever made.", date: new Date() },
  ]);

  await Joke.insertMany(
    localJokes.map((j) => ({ ...j, source: "local" as const }))
  );

  console.log(`Seeded ${movies.length} movies, ${users.length} users, jokes, and reviews.`);
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
