import { useEffect, useRef, useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { User } from "../../assets/types";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

import ImgRuleta from "../../assets/img/ruleta.png";
import Music from "../../assets/music/music.mp3";
import Ganar from "../../assets/music/ganar.mp3";
import JugadoresData from "../../data/jugadores";

const Roulette = ({
  loggedUser,
  users,
  getUserList
}: {
  loggedUser: string;
  users?: User[];
  getUserList:()=>void
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
  const [jugadores] = useState(JugadoresData.concat(JugadoresData));

  useEffect(() => {
    const handlePlaySound = () => {
      audioRef.current.volume = 0.1;
      audioRef.current.play();
    };

    // Agregar el evento al document
    document.addEventListener("click", handlePlaySound);

    // Cleanup: eliminar el evento cuando el componente se desmonte
    return () => {
      document.removeEventListener("click", handlePlaySound);
    };
  }, []);

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

  const animarEvent = () => {
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

      getUserList();

      const ganar = new Audio(Ganar);
      ganar.play();

      MySwal.fire({
        title: jugadorGanador?.name,
        text: jugadorGanador?.message,
        imageAlt: "Custom image",
      }).then(() => {
        setDataRuleta(ultimoJugadorSelecionado * circuloPorJugador);
      });
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>; // Muestra un mensaje de carga si los datos no están listos
  }
  return (
    <div className="ms:w-[500px] w-[450px] text-black bg-white shadow-2xl flex justify-center items-center px-10 py-5 sm:p-3 overflow-hidden rounded-3xl flex-col gap-3">
      <div className="flex flex-col items-center gap-2 -mb-10 z-20">
        <div className="text-red-950 text-6xl">
          <span>&#8595;</span>
        </div>
      </div>
      <img
        className="aspect-auto w-full z-10"
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
        className="z-20 group bg-red-500 p-4 rounded-md text-white text-2xl w-1/2 hover:bg-red-800 transition-colors disabled:bg-gray-600"
      >
        Girar
      </button>
    </div>
  );
};

export default Roulette;
