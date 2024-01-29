import React, { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useNavigate } from "react-router-dom";

const Room = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  //// Handling UserJoined_Room
  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`A ${email} has joined ${id}`);
    setRemoteSocketId(id);
  }, []);

  //// Handling User Calls
  const handleUserCall = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  //// Handling Incoming Calls
  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`incoming call: ${from},${offer}`);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  //// Handling Accepting Calls
  const handleAcceptedCall = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  //// Handling Negotiations
  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleCutCall = useCallback(async () => {
    navigate("/");
  });

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleIncomingNegoNeeded = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeededFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleAcceptedCall);
    socket.on("peer:nego:needed", handleIncomingNegoNeeded);
    socket.on("peer:nego:final", handleNegoNeededFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleAcceptedCall);
      socket.off("peer:nego:needed", handleIncomingNegoNeeded);
      socket.off("peer:nego:final", handleNegoNeededFinal);
    };
  }, [
    socket,
    handleIncomingCall,
    handleUserJoined,
    handleAcceptedCall,
    handleIncomingNegoNeeded,
    handleNegoNeededFinal,
  ]);

  return (
    <div>
      <h1 className="text-slate-700 text-center text-4xl font-black tracking-wide my-5 md:text-6xl">
        Welcome To Room
      </h1>
      <hr className="text-center flex justify-center w-1/4 my-0 mx-auto" />
      <h4 className="text-slate-700 text-center text-4xl font-black tracking-wide my-5 md:text-4xl">
        {remoteSocketId ? "Connected" : "No one in Room"}
      </h4>

      <div className="flex justify-center gap-5 items-center">
        <div className="flex justify-center items-center">
          {remoteSocketId && (
            <>
              {myStream ? (
                <>
                  <button
                    className="text-white px-3 w-[7rem] py-2 font-medium bg-red-500 hover:bg-red-600 rounded-lg"
                    onClick={handleCutCall}
                  >
                    Cut
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="text-white px-3 w-[7rem] py-2 font-medium bg-green-500 hover:bg-green-600 rounded-lg"
                    onClick={handleUserCall}
                  >
                    Call
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <div>
          {myStream && (
            <>
              <div className="flex justify-center ">
                <button
                  className="text-white px-3 py-2 font-medium bg-indigo-500 hover:bg-indigo-600 rounded-lg"
                  onClick={sendStreams}
                >
                  Send Stream
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="md:flex justify-center flex-wrap lg:gap-60 items-center mt-5 md:p-4 p-2 md:mt-20">
        {myStream && (
          <>
            <div className="md:flex justify-center items-center">
              <h1 className="text-center tracking-wide text-3xl md:text-5xl font-semibold md:-rotate-90 text-indigo-600">
                My Stream
              </h1>

              <div className="flex items-center justify-center lg:scale-[1.5]">
                <ReactPlayer
                  playing
                  muted
                  url={myStream}
                  width="350px"
                  height="300px"
                />
              </div>
            </div>
          </>
        )}
        <hr className="lg:hidden text-center flex justify-center w-1/4 my-0 mx-auto h-2" />
        {remoteStream && (
          <>
            <div className="md:flex justify-center items-center flex-row-reverse p-2">
              <h1 className="text-center text-3xl md:text-5xl font-semibold md:rotate-90 text-indigo-600  ">
                Remote Stream
              </h1>
              <div className="flex items-center justify-center lg:scale-[1.5]">
                <ReactPlayer
                  playing
                  muted
                  url={remoteStream}
                  width="350px"
                  height="300px"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Room;
