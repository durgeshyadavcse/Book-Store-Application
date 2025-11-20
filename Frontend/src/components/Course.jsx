import React, { useEffect, useState } from "react";
import Cards from "./Cards";
import axios from "axios";
import { Link } from "react-router-dom";
function Course() {
  const [book, setBook] = useState([]);
  useEffect(() => {
    const getBook = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || "http://localhost:4001";
        const res = await axios.get(`${base}/book`);
        console.log(res.data);

        // Normalize any malformed documents where a JSON object was used as a field key
        const normalize = (doc) => {
          // If image/name exist at top-level, return as-is
          if (doc.image || doc.name) return doc;

          // Otherwise look for a key that appears to be a JSON string
          const keys = Object.keys(doc);
          const jsonKey = keys.find((k) => typeof k === "string" && k.trim().startsWith("{") && k.trim().endsWith("}"));
          if (!jsonKey) return doc;
          try {
            const parsed = JSON.parse(jsonKey);
            // preserve _id from original document if present
            if (doc._id) parsed._id = doc._id;
            return parsed;
          } catch (e) {
            return doc;
          }
        };

        setBook(res.data.map(normalize));
      } catch (error) {
        // Better error logging to help diagnose network / CORS / server issues
        console.error("Fetch books failed:", {
          message: error?.message,
          code: error?.code,
          response: error?.response?.data ?? error?.response,
          request: !!error?.request,
        });
        setBook([]);
      }
    };
    getBook();
  }, []);
  return (
    <>
      <div className=" max-w-screen-2xl container mx-auto md:px-20 px-4">
        <div className="mt-28 items-center justify-center text-center">
          <h1 className="text-2xl  md:text-4xl">
            "Welcome aboard! Dive in and start your journey with content created to inspire learning, creativity, and growth."{" "}
            <span className="text-blue-500"> Here! :</span>
          </h1>
          <p className="mt-12">
            Discover a curated library of free courses created by industry experts. Each lesson is designed to be practical, up-to-date, and easy to follow so you can build skills that matter!
          </p>
          <Link to="/">
            <button className="mt-6 bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 duration-300">
              Back
            </button>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4">
          {book.map((item, idx) => (
            <Cards key={item._id ?? item.id ?? idx} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}

export default Course;
