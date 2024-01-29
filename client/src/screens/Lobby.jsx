import React, { useCallback, useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
const Lobby = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitform = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(({ email, room }) => {
    navigate(`/room/${room}`);
  });

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    //// cleanUp func
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <>
      <h1 className="text-slate-700 text-center text-4xl font-black tracking-wide my-5 md:text-6xl">
        Welcome To Lobby
      </h1>
      <hr className="text-center flex justify-center w-1/4 my-0 mx-auto" />
      <div className="p-4 md:flex md:justify-center mt-10 gap-10">
        <form
          onSubmit={handleSubmitform}
          className="md:w-[35%] md:items-center text-center bg-indigo-400 rounded-2xl md:min-h-[30rem]"
        >
          <label
            htmlFor="email"
            className="mr-5 my-5 font-semibold  text-gray-600"
          >
            Email-Id
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            id="email"
            className="bg-slate-700 p-2 md:p-4 rounded-xl text-slate-200 my-5 w-[50%]"
          />
          <br />
          <label
            htmlFor="room"
            className="mr-5 my-5 font-semibold text-gray-600"
          >
            Room-Id
          </label>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            type="text"
            placeholder="Room-ID"
            id="room"
            className="bg-slate-700 p-2 md:p-4 rounded-xl text-slate-200 my-5 w-[50%]"
          />
          <br />
          <button className="py-2 px-4 bg-red-400 hover:bg-blue-500 text-white rounded-xl mb-5 md:w-[15%] text-xl font-semibold">
            {" "}
            Join
          </button>
        </form>
      </div>
    </>
  );
};

export default Lobby;
