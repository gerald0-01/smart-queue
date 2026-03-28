import { College } from "@/generated/prisma/enums"

export const registerInitialState = {
    firstName: "",
    lastName: "",
    email: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
    college: College.CCS,
    course: ""
}

export function registerReducer(state: any, action: any) {
    switch(action.type) {
        case 'SET_FIELD':
            return {...state, [action.field]: action.value}
        case 'RESET':
            return registerInitialState
        default:
            return state
    }
}