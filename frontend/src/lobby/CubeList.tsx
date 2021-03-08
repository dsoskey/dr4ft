import React, { useState, Fragment, KeyboardEvent } from "react";
import axios from "axios";

import { TextArea } from "../components/TextArea";
import { app } from "../router";
import _chunk from "lodash/chunk";
import { ScryfallCardData } from "common/src/types/card";

const CubeList = () => {
  return (<div id='cube-list'>
    <div>
      <CubeCobra />
    </div>
    <br />
    <div>
      <ManualCubeInput />
    </div>
  </div>
  );
};

const ManualCubeInput = () => {
  const cubeListLength =
    app.state.list.length === 0
      ? 0
      : app.state.list.split("\n").length;

  return (
    <Fragment>
      <div>{`Or copy and paste your cube. One card per line! (${cubeListLength} cards)`}</div>
      <TextArea className="cube-list"
        placeholder='Cube List'
        link='list'
      />
    </Fragment>
  );
};

const CubeCobra = () => {
  const [name, setName] = useState<string>("");
  const [error, setError] = useState("");
  const [cubeImportMessage, setCubeImportMessage] = useState("");

  const getCubeCobraList = async (cubeId?: string) => {
    if (!cubeId) {
      return;
    }

    try {
      const {data: {cards}} = await axios.get(`https://cubecobra.com/cube/api/cubeJSON/${cubeId}`);

      setCubeImportMessage(`Fetching card versions... (0/${cards.length})`);

      let totalCards = 0;
      const cardNames = (await Promise.all(
        _chunk(cards, 75)
          .map(async (chunk: any[]) => {
            const {data} = await axios.post(
              'https://api.scryfall.com/cards/collection',
              {identifiers: chunk.map((card) => ({id: card.cardID}))});

            totalCards += data.data.length;
            setCubeImportMessage(`Fetching card versions... (${totalCards}/${cards.length})`);

            return data.data.map((card: ScryfallCardData) => {
              const name = card.card_faces ? card.card_faces[0].name : card.name;
              return `${name} (${card.set} ${card.collector_number.replace('★', '')})`;
            });
          })
      )).flat().join('\n');

      setError("");
      setCubeImportMessage(`The cube with ID "${cubeId}" was imported`);

      app.save("list", cardNames);
    } catch (_) {
      setError(`Could not retrieve CubeCobra list with ID "${cubeId}" (${_})`);
      setCubeImportMessage("");
    }
  };

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter"){
      return;
    }

    return getCubeCobraList(name);
  };

  return (
    <Fragment >
      <div>
        Import from <a href="https://cubecobra.com/" target="_blank" rel="noopener noreferrer">CubeCobra</a>. Paste the ID for your cube and then press enter.
      </div>
      <label>
        <input
          type='text'
          value={name}
          className={error ? "error": ""}
          placeholder="CubeCobra Cube ID"
          onKeyPress={onKeyPress}
          onChange={(e: React.ChangeEvent<any>) => setName(e.target.value)} />
      </label>

      <div>
        <small>{cubeImportMessage}</small>
        <small className="error">{error}</small>
      </div>
    </Fragment>
  );
};

export default CubeList;
