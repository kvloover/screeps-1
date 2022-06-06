import { DependencyContainer } from "tsyringe";

export interface RoleService {
    register(cont: DependencyContainer, phase: number): void;
}
