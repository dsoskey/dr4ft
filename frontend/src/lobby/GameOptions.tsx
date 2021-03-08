import React, {Fragment} from "react";
import PropTypes from "prop-types";

import _ from "../utils";

import { Checkbox } from "../components/Checkbox";
import { Select } from "../components/Select";

import { Set } from "./Set";
import { SetReplicated } from "./SetReplicated";
import CubeList from "./CubeList";
import { app } from "../router";
import { SetType } from "../app";

const GameOptions = () => {
  const { 
      setsDraft, setsSealed, setsDecadentDraft, 
      gametype, gamesubtype, 
      picksPerPack} = app.state;

  switch (`${gamesubtype} ${gametype}`) {
  case "regular draft":
    return <RegularDraft sets={setsDraft} type={"setsDraft"}  picksPerPack={picksPerPack}/>;
  case "regular sealed":
    return <RegularSealed sets={setsSealed} type={"setsSealed"} />;
  case "decadent draft":
    return <Decadent sets={setsDecadentDraft} type={"setsDecadentDraft"} picksPerPack={picksPerPack}/>;
  case "cube draft":
    return <CubeDraft picksPerPack={picksPerPack} />;
  case "cube sealed":
    return <CubeSealed />;
  case "chaos draft":
    return <ChaosDraft picksPerPack={picksPerPack} />;
  case "chaos sealed":
    return <ChaosSealed />;
  default:
    return null;
  }
};

interface RegularDraftProps extends RegularProps {
  picksPerPack: number;
}
const RegularDraft = ({sets, type, picksPerPack}: RegularDraftProps) => (
  <div>
    <Regular sets={sets} type={type} />
    <PicksPerPacks picksPerPack={picksPerPack} />
  </div>
);

interface RegularSealedProps extends RegularProps {}
const RegularSealed = ({sets, type}: RegularSealedProps) => (
  <Regular sets={sets} type={type} />
);

interface RegularProps {
  sets: any[];
  type: SetType;
}
const Regular = ({sets, type}: RegularProps) => (
  <Fragment>
    <div>
      Number of packs:{" "}
      <Select
        value={sets.length}
        onChange={app._emit("changeSetsNumber", type)}
        opts={_.seq(12, 1)} />
    </div>
    <div>
      <Sets sets={sets} type={type} />
    </div>
  </Fragment>
);

const Sets = ({sets, type}: RegularProps) => (
  <>{sets.map((set, i) => <Set type={type} selectedSet={set} index={i} key={i} />)}</>
);

const Decadent = ({sets, type, picksPerPack}: RegularDraftProps) => (
  <Fragment>
    <div>
      Number of packs:{" "}
      <Select
        value={sets.length}
        onChange={app._emit("changeSetsNumber", type)}
        opts={_.seq(60, 36)}
      />
    </div>
    <div>
      <SetReplicated type={type} selectedSet={sets[0]} />
    </div>
    <PicksPerPacks picksPerPack={picksPerPack} />
  </Fragment>
);

interface CubeDraftProps {
  picksPerPack: number;
}
const CubeDraft = ({picksPerPack}: CubeDraftProps) => (
  <div>
    <CubeList />
    <CubeOptions />
    <PicksPerPacks picksPerPack={picksPerPack} />
    <BurnsPerPacks />
  </div>
);

const CubeSealed = () => (
  <div>
    <CubeList />
    <CubeSealedOptions />
  </div>
);

const CubeSealedOptions = () => (
  <div>
    Cards per player:{" "}
    <Select link="cubePoolSize" opts={_.seq(120, 15)} />
  </div>
);

const CubeOptions = () => (
  <div>
    <div>
      Number of packs:{" "}
      <Select link="packs" opts={_.seq(12, 1)} />
    </div>
    <div>
      Cards per pack:{" "}
      <Select link="cards" opts={_.seq(30, 5)} />
    </div>
  </div>
);

const ChaosDraft = ({picksPerPack}: CubeDraftProps) => (
  <div>
    <Chaos packsNumber={"chaosDraftPacksNumber"} />
    <PicksPerPacks picksPerPack={picksPerPack} />
  </div>
);

const ChaosSealed = () => (
  <Chaos packsNumber={"chaosSealedPacksNumber"} />
);

const PicksPerPacks = ({picksPerPack}: CubeDraftProps) => (
  <div>
  Picks per pack:{" "}
  <Select
    value={picksPerPack}
    onChange={app._emit("changePicksPerPack")}
    opts={_.seq(12, 1)} />
  </div>
)

const BurnsPerPacks = () => (
  <div>
    Burns per pack:{" "}
    <Select link={"burnsPerPack"} opts={_.seq(4, 0)} /> 
  </div>
);

interface ChaosProps {
  packsNumber: "chaosDraftPacksNumber" | "chaosSealedPacksNumber";
}
const Chaos = ({packsNumber}: ChaosProps) => (
  <div>
    <div>
      Number of packs:{" "}
      <Select
      // TODO: Double check "packs" is the right state
        onChange={(e) => {app.save(packsNumber, parseInt(e.currentTarget.value));}}
        link={packsNumber}
        opts={_.seq(12, 3)} />
    </div>
    <div>
      <Checkbox onChange={() => {}} link='modernOnly' side='right' text='Only Modern Sets: ' />
    </div>
    <div>
      <Checkbox onChange={() => {}} link='totalChaos' side='right' text='Total Chaos: ' />
    </div>
  </div>
);

Chaos.propTypes = {
  packsNumber: PropTypes.string
};

export default GameOptions;
