export const requestInitialState = {
    name: "",
    purpose: "",
    notes: "",
    customName: ""
} 

export function requestReducer(state: any, action: any) {
    switch(action.type) {
        case 'SET_FIELD':
            return {...state, [action.field]: action.value}
        case 'RESET':
            return requestInitialState
        default:
            return state
    }
}