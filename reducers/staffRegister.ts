import { College } from "@prisma/client"

export const staffRegisterInitialState = {
    firstName: "",
    lastName: "",
    email: "",
    idNumber: "",
    password: "",
    confirmPassword: ""
}

export function staffRegisterReducer(state: any, action: any) {
    switch(action.type) {
        case 'SET_FIELD':
            return {...state, [action.field]: action.value}
        case 'RESET':
            return staffRegisterInitialState
        default:
            return state
    }
}