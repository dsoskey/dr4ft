import React, { useState, useRef } from "react";

import _ from "../utils";
import { RadioOptions } from "../components/RadioOptions";
import { Modal } from "../components/Modal";

import { GameTypes } from "./GameTypes";
import GameOptions from "./GameOptions";
import { app } from "../router";

// set this out here so the create button has the capability
// to open the modal
let showModal: () => void;
let createModalButtonRef: any;

interface ModalSectionProps {
  hide?: boolean;
  label: string;
  inputId?: string;
  children: React.ReactNode;
}

const ModalSection = (props: ModalSectionProps) => {
  if (props.hide) {
    return null;
  }

  return (
    <div className="modal-section">
      <label htmlFor={props.inputId}>{props.label}</label>
      <div className="modal-section-content">{props.children}</div>
    </div>
  );
};

const CreateRoomModal = () => {
  const [open, setOpen] = useState(false);
  const draftNameInput = useRef<HTMLInputElement | null>(null);

  showModal = () => {
    setOpen(true);
    // must wait for the modal to be open
    // before we can focus on the input
    setTimeout(() => {
      draftNameInput.current?.focus();
    }, 200);
  };

  const closeModal = () => {
    setOpen(false);
    createModalButtonRef.current.focus();
  };

  const {title, seats} = app.state;
  const gameTypes = ["draft", "sealed"];

  return (
    <Modal
      show={open}
      headerText="Create"
      footerConfirmButtonText="Create"
      onClose={closeModal}
      onConfirm={() => {
        console.log('Creating game');
        app.emit("create")
      }}
    >
      <ModalSection
        label="Title"
        inputId="game-title-input"
      >
        <input type='text'
          ref={draftNameInput}
          id="game-title-input"
          placeholder="Game Room Name"
          value={title}
          onChange={(e) => app.save("title", e.currentTarget.value)}
        />
        <div>
          <span className='connected-container'>
            <RadioOptions
              name="type"
              description="Game type"
              appProperty="gametype"
              options={gameTypes.map(type => {
                return {
                  label: _.toTitleCase(type),
                  value: type
                };
              })}
              onChange={() => {
                // always change back to the default when updating main
                // game type
                app.save("gamesubtype", "regular");
              }}
            />
          </span>
        </div>
      </ModalSection>
      <ModalSection
        label="Players"
        inputId="game-players-input"
      >
        <select id="game-players-input" value={seats} onChange={(e) => {app.save("seats", e.currentTarget.value);}}>
          {_.seq(100, 1).map((x: number, i: number) =>
            <option key={i}>{x}</option>)}
        </select>
        <RadioOptions
          name="public-private"
          description="Create a public or private game"
          appProperty="isPrivate"
          options={[{
            label: "Public",
            value: false,
            tooltip: "Anyone can join"
          }, {
            label: "Private",
            value: true,
            tooltip: "A link is required to join"
          }]}
        />
      </ModalSection>
      <ModalSection
        label="Type"
        inputId="game-type-input"
      >
        <GameTypes/>
      </ModalSection>
      <ModalSection
        label="Packs"
        inputId="game-packs-input"
      >
        <GameOptions/>
      </ModalSection>
      {/* TODO This probably needs a better design, but for now, just show all app errors here since most of them at this stage will be about the room setup failing */}
      <ModalSection
        hide={!app.err}
        label="Error"
      >
        <p dangerouslySetInnerHTML={{__html: app.err}} className='error' />
      </ModalSection>
    </Modal>
  );
};

export const CreatePanel = () => {
  createModalButtonRef = useRef(null);

  return (
    <fieldset className='fieldset'>
      <legend className='legend'>
        Create a Room
      </legend>
      <CreateRoomModal />
      <p>
        <button ref={createModalButtonRef} onClick={e => {
          showModal();
        }}>
          Create Room
        </button>
      </p>
    </fieldset>
  );
};
