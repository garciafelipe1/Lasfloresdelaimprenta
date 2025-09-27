// import {
//   createStep,
//   createWorkflow,
//   StepResponse,
//   WorkflowResponse,
// } from "@medusajs/framework/workflows-sdk";
// import { MEMBERSHIP_MODULE } from "../../modules/membership";
// import MembershipModuleService from "../../modules/membership/service";

// const getAllMembersStep = createStep(
//   "get-all-members",
//   async (input: void, { container }) => {
//     const membershipModuleService: MembershipModuleService =
//       container.resolve(MEMBERSHIP_MODULE);

//     const members = await membershipModuleService.listMemberships();
//     return new StepResponse(members);
//   }
// );

// export const getMembershipsWorkflow = createWorkflow("get-all-members", () => {
//   const members = getAllMembersStep();
//   return new WorkflowResponse(members);
// });
