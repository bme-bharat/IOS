import { generateAvatarFromName } from "../../helperComponents.jsx/useInitialsAvatar";

const initialState = {
  profile: null,
};

const CompanyReducer = (state = initialState, action) => {

  switch (action.type) {
    case 'UPDATE_COMPANY_PROFILE': {
      const incoming = action.payload || {};
      const current = state.profile || {};

      // Determine imageUrl only if fileKey is present and non-empty
      const hasFileKey = incoming.fileKey?.trim();
      const imageUrl = hasFileKey ? incoming.imageUrl || null : null;

      // Always generate avatar based on priority
      const fullName = `${incoming.first_name || ''} ${incoming.last_name || ''}`.trim();
      const avatarName = incoming.company_name?.trim() || fullName || 'BME';
      const companyAvatar = generateAvatarFromName(avatarName);

      const newState = {
        ...state,
        profile: {
          ...current,
          ...incoming,
          imageUrl,
          companyAvatar,
        },
      };
      
      return newState;
    }

    default:
      return state;
  }
};

export default CompanyReducer;