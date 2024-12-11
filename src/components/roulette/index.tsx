import { useEffect, useRef, useState } from "react";
import ImgRuleta from "../../assets/img/ruleta.png";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { User } from "../../assets/types";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
const MySwal = withReactContent(Swal);

import Music from "../../assets/music/music.mp3";

const Roulette = ({
  loggedUser,
  users,
}: {
  loggedUser: string;
  users?: User[];
}) => {
  const ruletaRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef(new Audio(Music));
  const [animatedRuleta, setAminatedRuleta] = useState(false);
  const [dataRuleta, setDataRuleta] = useState(0);
  const [ultimoJugadorSelecionado] = useState(0);
  const [jugadorSelecionado, setJugadorSelecionado] = useState("");
  const [alreadyVote, setAlreadyVote] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Estado para manejar la carga de datos
  const votesCollectionRef = collection(db, "vote");

  const [jugadores] = useState([
    { name: "Alejandra", message: `` },
    { name: "Santiago", message: `` },
    { name: "Luisa", message: `` },
    {
      name: "Sebastian",
      message: `
      Hola, querido amigo secreto:
      Soy una persona que disfruta las cosas que nos hacen sentir bien: un buen libro que te atrape, ropa cómoda que te haga ver y sentir genial, y, por supuesto, algo rico para disfrutar al paladar. Este año tengo un pequeño detalle: Estoy con un pie que necesita descanso y paciencia, así que cualquier regalo que me ayude a pasar el rato será más que bienvenido. 😉
      ¡Confío en que tu creatividad dará en el clavo! 🎁
      `,
    },
    { name: "Andres", message: `` },
    {
      name: "Ivan",
      message: `
      Hola, querido amigo secreto:
      Soy alguien que disfruta de los videojuegos y la tecnología. También me encanta pasar tiempo viendo películas y compartiendo momentos con amigos o familia. Me gustan los detalles sencillos y prácticos, y realmente aprecio cualquier cosa que venga con cariño.
      No hay nada que quiera evitar, así que confío en tu creatividad para sorprenderme. ¡Gracias desde ya por el regalo! 😊
      `,
    },
    { name: "Alejandra", message: `` },
    { name: "Santiago", message: `` },
    { name: "Luisa", message: `` },
    {
      name: "Sebastian",
      message: `
      Hola, querido amigo secreto:
      Soy una persona que disfruta las cosas que nos hacen sentir bien: un buen libro que te atrape, ropa cómoda que te haga ver y sentir genial, y, por supuesto, algo rico para disfrutar al paladar. Este año tengo un pequeño detalle: Estoy con un pie que necesita descanso y paciencia, así que cualquier regalo que me ayude a pasar el rato será más que bienvenido. 😉
      ¡Confío en que tu creatividad dará en el clavo! 🎁
      `,
    },
    { name: "Andres", message: `` },
    {
      name: "Ivan",
      message: `
      Hola, querido amigo secreto:
      Soy alguien que disfruta de los videojuegos y la tecnología. También me encanta pasar tiempo viendo películas y compartiendo momentos con amigos o familia. Me gustan los detalles sencillos y prácticos, y realmente aprecio cualquier cosa que venga con cariño.
      No hay nada que quiera evitar, así que confío en tu creatividad para sorprenderme. ¡Gracias desde ya por el regalo! 😊
      `,
    },
  ]);

  const ResultRuleta = async () => {
    if (ruletaRef.current) {
      ruletaRef.current.classList.remove("img-ruleta");
      setAminatedRuleta(false);
      const circuloPorJugador = 360 / jugadores.length;
      const votedId = users?.find(
        (user) => user.name.toUpperCase() === loggedUser.toUpperCase()
      )?.id;
      const voterId = users?.find(
        (user) => user.name.toUpperCase() === jugadorSelecionado.toUpperCase()
      )?.id;

      const jugadorGanador = jugadores.find(
        (jugador) => jugador.name === jugadorSelecionado
      );

      await addDoc(votesCollectionRef, {
        voter: voterId, // ID del usuario que vota
        voted: votedId, // ID del usuario por el que vota
        timestamp: Timestamp.now(),
      });

      MySwal.fire({
        title: jugadorGanador?.name,
        text: jugadorGanador?.message,
        imageAlt: "Custom image",
      }).then(() => {
        setDataRuleta(ultimoJugadorSelecionado * circuloPorJugador);
        window.location.reload();
      });
    }
  };

  const animarEvent = () => {
    handlePlaySound();
    const grados_circulo = 360;
    let valor_aleatorio = Math.floor(Math.random() * jugadores.length);

    const jugadoresSinVotos = users
      ?.filter((user) => {
        if (user.name.toUpperCase() === loggedUser.toUpperCase()) {
          return false;
        }
        return true;
      })
      .filter((user) => {
        return !users.find((u) => u.vote?.voter === user.id);
      })
      .map((user) => user.name.toUpperCase());
    let isValidJugador = jugadoresSinVotos?.includes(
      jugadores[valor_aleatorio].name.toLocaleUpperCase()
    );
    while (!isValidJugador) {
      valor_aleatorio = Math.floor(Math.random() * jugadores.length);
      isValidJugador = jugadoresSinVotos?.includes(
        jugadores[valor_aleatorio].name.toLocaleUpperCase()
      );
    }

    const circuloPorJugador = grados_circulo / jugadores.length;
    const giro_ruleta = circuloPorJugador * valor_aleatorio;
    const sumaGiros = grados_circulo * 10 + giro_ruleta;
    setJugadorSelecionado(jugadores[valor_aleatorio].name);
    setDataRuleta(ultimoJugadorSelecionado * circuloPorJugador);
    setAminatedRuleta(true);

    setTimeout(() => {
      if (ruletaRef.current) {
        ruletaRef.current.classList.add("img-ruleta");
        setDataRuleta(sumaGiros);
      }
    }, 200);
  };

  useEffect(() => {
    if (users && users.length > 0 && loggedUser !== "") {
      const loggedInUser = users.find((user) => user.name === loggedUser);

      if (loggedInUser) {
        // Verifica si el usuario logueado tiene un voto
        if (loggedInUser.vote !== undefined) {
          setAlreadyVote(true); // Si tiene un voto, deshabilitar
        } else {
          setAlreadyVote(false); // Si no tiene un voto, habilitar
        }
      }
    }
  }, [users, loggedUser]);

  // Verifica si los datos están cargados antes de renderizar
  useEffect(() => {
    if (users && users.length > 0) {
      setIsLoading(false); // Datos cargados
    }
  }, [users]);

  if (isLoading) {
    return <div>Cargando...</div>; // Muestra un mensaje de carga si los datos no están listos
  }

  const handlePlaySound = () => {
    audioRef.current.volume = 0.2;
    audioRef.current.play();
  };
  return (
    <div className="ms:w-[500px] w-[450px] text-black bg-white flex justify-center items-center px-10 py-5 sm:p-3 overflow-hidden rounded-3xl flex-col gap-3">
      <div className="flex flex-col items-center gap-2 -mb-10 z-20">
        <div className="text-red-950 text-6xl">
          <span>&#8595;</span>
        </div>
      </div>
      <img
        className="aspect-auto w-full"
        src={ImgRuleta}
        style={{
          transform: "rotate(-" + dataRuleta + "deg)",
          WebkitTransform: "rotate(-" + dataRuleta + "deg)",
          filter: alreadyVote ? "grayscale(70%)" : "none", // Aplica grises si está deshabilitado
          pointerEvents: alreadyVote ? "none" : "auto", // Deshabilita la interacción si está deshabilitado
        }}
        alt="ruleta navideña"
        onTransitionEnd={ResultRuleta}
        ref={ruletaRef}
      />

      <button
        onClick={animarEvent}
        disabled={animatedRuleta || alreadyVote} // Deshabilita si ya votó
        className="z-50 group bg-red-500 p-4 rounded-md text-white text-2xl w-1/2 hover:bg-red-800 transition-colors disabled:bg-gray-600"
      >
        Girar
      </button>
    </div>
  );
};

export default Roulette;
