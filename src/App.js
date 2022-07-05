import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Input,
  Container,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { app } from "./firebase";
import Message from "./components/Message";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query, orderBy
} from "firebase/firestore";

const db = getFirestore(app);
const auth = getAuth(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider);
};

const logouthandler = () => {
  signOut(auth);
};

function App() {
  
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");


  const divForScroll = useRef(null);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db,"Messages"),orderBy("createdAt","asc"))
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setUser(data);
    });

    const unsubscribeForMessage = onSnapshot(q,(snap)=>{
        setMessages(snap.docs.map((item) =>{
            const id = item.id;
            return { id, ...item.data()};
        }))
    })

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  },[]);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

      
      divForScroll.current.scrollIntoView({ behavior:"smooth"});
    } catch (error) {
      alert(error);
    }
  };

  return (
    <Box bg={"red.100"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h={"full"} paddingY={"4"}>
            <Button onClick={logouthandler} colorScheme={"blue"} w={"full"}>
              Logout
            </Button>

            <VStack h={"full"} w={"full"} overflowY="auto">
              {messages.map((item) => (
                <Message
                key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                />
              ))}
              <div ref={divForScroll}></div>
            </VStack>
                  
            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter Your Message..."
                />
                <Button colorScheme={"purple"} type="submit">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg={"white"} justifyContent={"center"} h={"100vh"}>
          <Button onClick={loginHandler} colorScheme={"purple"}>
            SignIn with Google
          </Button>
        </VStack>
      )}
    </Box>
  );
}

export default App;
