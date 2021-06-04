import React from "react";
import { Spaced } from "../components/Spaced";
import { app } from "../router";

interface RoomInfo {
  id: string;
  title: string;
  type: string;
  packsInfo: string;
  usedSeats: string;
  totalSeats: string;
}
interface JoinPanelProps {
  roomInfo: RoomInfo[];
}
export const JoinPanel = ({roomInfo}: JoinPanelProps) => {
  return (
    <>
      <ServerInfo />
      {roomInfo.length > 0 && (<table className='join-room-table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Infos</th>
              <th>Players</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {roomInfo.map(room => <tr key={room.id}>
              <td>{room.title}</td>
              <td>{room.type}</td>
              <td>{room.packsInfo}</td>
              <td>{room.usedSeats}/{room.totalSeats}</td>
              <td>
                <a href={`#g/${room.id}`} className='join-room-link'>
                    Join room
                </a>
              </td>
            </tr>)}
          </tbody>
        </table>
      )}
    </>
  );
};

const ServerInfo = () => {
  const { numUsers, numPlayers, numActiveGames } = app.state;
  const users = `${numUsers} ${numUsers === 1
    ? "user"
    : "users"} connected`;

  const players = `${numPlayers}
     ${numPlayers === 1
    ? "player"
    : "players"}
      playing ${numActiveGames}
        ${numActiveGames === 1
    ? "game"
    : "games"}`;

  return <p><Spaced elements={[users, players]} /></p>;
};