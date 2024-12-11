import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./config/firebase";
import Roulette from "./components/roulette";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { User, Vote } from "./assets/types";

const MySwal = withReactContent(Swal);

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
              if (user.name.toUpperCase() === loggedUser.toUpperCase()) {
                return false;
              }
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
              allowEscapeKey:false,
              allowOutsideClick:false,
              backdrop:true,
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
          preConfirm: async (userInput) => {
            const filterUser = users.find((user) => user.name === userInput);
            if (!filterUser) {
              return MySwal.showValidationMessage(
                `No te hemos encontrado, ¡intenta otro nombre!`
              );
            }
            localStorage.setItem("me", userInput);
            setLoggedUser(userInput);
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

  return (
    <main className="w-full h-screen bg-red-400 flex justify-center items-center bg-hero-pattern bg-no-repeat bg-cover flex-col gap-5 relative">
      <>
        <span className="text-white text-5xl md:text-8xl bg-white/30 rounded-full p-5 font-bold">
          ¡Ruleta Navideña!
        </span>
        <div className="flex flex-col sm:flex-row  w-full justify-center items-center gap-3 pb-3 sm:pb-0">
          <Roulette loggedUser={loggedUser} users={users} />
          {userLogged?.vote && (
            <div className="w-60 bg-white py-5 rounded-2xl sm:rounded-r-2xl mt-0 sm:-mt-10 flex justify-center text-center px-4">
              <h3 className="text-2xl">Tu Amigo secreto:</h3>
              <span className="text-3xl font-bold">
                {
                  users.find((user) => {
                    return userLogged.vote?.voter === user.id;
                  })?.name
                }
              </span>
            </div>
          )}
        </div>
      </>
    </main>
  );
};

export default App;
