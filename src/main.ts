import "reflect-metadata";
import { ErrorMapper } from "utils/ErrorMapper";
import { container } from "tsyringe";

// import { CreepsManager } from "creeps";
// import { RoomManager } from "room";
import { Manager, Managers } from "manager";


// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {

  const managers = container.resolveAll<Manager>(Managers.token)
  managers.forEach(manager => {
    manager.run();
  });

});
