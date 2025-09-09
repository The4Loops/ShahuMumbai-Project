import { createContext, useContext } from "react";

export const AdminActionsContext = createContext({
  openProductEditor: (_id) => {},
  openCollectionEditor: (_id) => {},
  openBannerEditor:(_id)=>{},
});

export const useAdminActions = () => useContext(AdminActionsContext);
