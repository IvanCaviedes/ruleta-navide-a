import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Tooltip } from "react-tooltip";

import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
const MySwal = withReactContent(Swal);

import { db } from "./config/firebase";
import Roulette from "./components/roulette";
import { User, Vote } from "./assets/types";
import JugadoresData from "./data/jugadores";

const App = () => {
  const userCollectionRef = collection(db, "users");
  const votesCollectionRef = collection(db, "vote");
  const [users, setUsers] = useState<User[]>([]);
  const [loggedUser, setLoggedUser] = useState<string>("");
  const [isUsersLoaded, setIsUsersLoaded] = useState(false); // Estado de carga de usuarios
  const [isLoading, setIsLoading] = useState(true); // Estado de carga de la aplicación

  // Obtener usuarios y sus votos
  useEffect(() => {
    getUserList();
  }, []);

  const getUserList = async () => {
    try {
      const data = await getDocs(userCollectionRef);
      const filteredData = data.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as User[];

      // Cargar los votos para cada usuario de forma optimizada
      const usersWithVotes = await Promise.all(
        filteredData.map(async (user) => {
          const q = query(votesCollectionRef, where("voted", "==", user.id));
          const querySnapshot = await getDocs(q);
          const vote = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }))[0] as Vote | undefined;
          return { ...user, vote };
        })
      );
      setUsers(usersWithVotes);
      setIsUsersLoaded(true); // Marcar que los usuarios están cargados
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false); // Finaliza la carga de datos
    }
  };

  useEffect(() => {
    // Manejar la autenticación del usuario
    if (isUsersLoaded) {
      const me = localStorage.getItem("me");
      if (!me) {
        if (users) {
          const jugadoresSinVotos = users
            ?.filter((user) => {
              if (!user.vote) {
                return true;
              }
              const apareceComoVoter = users.some(
                (u) => u.vote?.voter === user.id
              );
              return !apareceComoVoter;
            })
            .map((user) => user.name.toUpperCase());

          if (jugadoresSinVotos.length === 0) {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "No se permiten ver elecciones",
              allowEscapeKey: false,
              allowOutsideClick: false,
              backdrop: true,
              showConfirmButton: false,
            });
            return;
          }
        }

        MySwal.fire({
          title: "¡Ingresa tu nombre para girar la ruleta navideña! 🎄🎁",
          input: "text",
          inputPlaceholder: "Escribe tu nombre aquí...",
          confirmButtonText: "Adelante 🎄",
          showLoaderOnConfirm: true,
          allowEscapeKey: false,
          allowOutsideClick: false,
          width: 600,
          padding: "3em",
          color: "#716add",
          backdrop: `
            rgba(0,0,123,0.4)
            left top
            no-repeat
          `,
          preConfirm: async (userInput: string) => {
            const filterUser = users.find(
              (user) => user.name.toUpperCase() === userInput.toUpperCase()
            );
            if (!filterUser) {
              return MySwal.showValidationMessage(
                `No te hemos encontrado, ¡intenta otro nombre!`
              );
            }
            localStorage.setItem("me", userInput.toLowerCase());
            setLoggedUser(userInput.toLowerCase());
          },
        });
      } else {
        const filterUser = users.find((user) => user.name === me);
        if (filterUser) {
          setLoggedUser(filterUser.name);
        }
      }
    }
  }, [isUsersLoaded, users]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center bg-gradient-to-b from-purple-700 via-purple-800 to-purple-900 bg-opacity-50">
        <div className="flex flex-col items-center gap-5">
          {/* Spinner */}
          <div className="spinner-border animate-spin inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full shadow-lg"></div>
          <p className="text-white text-3xl font-semibold">
            Cargando usuarios...
          </p>
        </div>
      </div>
    );
  }

  const userLogged = users.find((user) => user.name == loggedUser);
  const userVoted = users.find((user) => {
    if (!userLogged) {
      return false;
    }
    return userLogged.vote?.voter === user.id;
  });

  return (
    <main className="w-full h-screen bg-red-400 flex justify-center items-center bg-hero-pattern bg-no-repeat bg-cover flex-col gap-5 relative">
      <>
        <span className="text-white text-5xl md:text-8xl bg-white/30 rounded-full p-5 font-bold">
          ¡Ruleta Navideña!
        </span>
        <div className="flex flex-col sm:flex-row  w-full justify-center items-center gap-3 pb-3 sm:pb-0">
          <Roulette
            loggedUser={loggedUser}
            users={users}
            getUserList={getUserList}
          />
          {userLogged?.vote && (
            <div className="w-auto bg-white py-5 rounded-2xl sm:rounded-r-2xl mt-0 sm:-mt-10 flex justify-center text-center px-2 items-center gap-1 relative">
              <h3 className="text-xl">Tu Amigo secreto:</h3>
              <span className="text-3xl font-bold capitalize">
                {userVoted?.name}
              </span>
              <div className="absolute top-1 right-2">
                <a data-tooltip-id="info-user">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="20"
                    height="20"
                    viewBox="0 0 50 50"
                  >
                    <path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609824 4 46 13.390176 46 25 C 46 36.609824 36.609824 46 25 46 C 13.390176 46 4 36.609824 4 25 C 4 13.390176 13.390176 4 25 4 z M 25 11 A 3 3 0 0 0 22 14 A 3 3 0 0 0 25 17 A 3 3 0 0 0 28 14 A 3 3 0 0 0 25 11 z M 21 21 L 21 23 L 22 23 L 23 23 L 23 36 L 22 36 L 21 36 L 21 38 L 22 38 L 23 38 L 27 38 L 28 38 L 29 38 L 29 36 L 28 36 L 27 36 L 27 21 L 26 21 L 22 21 L 21 21 z"></path>
                  </svg>
                </a>
              </div>

              <Tooltip id="info-user" className="z-30">
                <div className="w-60">
                  <span>
                    {
                      JugadoresData.find(
                        (jugador) =>
                          jugador.name.toUpperCase() ===
                          userVoted?.name.toUpperCase()
                      )?.message
                    }
                  </span>
                </div>{" "}
              </Tooltip>
            </div>
          )}
        </div>
      </>
    </main>
  );
};

export default App;
