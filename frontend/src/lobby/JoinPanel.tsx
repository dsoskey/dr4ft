import React from "react";

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
    <fieldset className='fieldset'>
      <legend className='legend'>Join a Room</legend>
      {roomInfo.length
        ? <table className='join-room-table'>
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
        : "There are no public rooms open currently."}
    </fieldset>
  );
};
