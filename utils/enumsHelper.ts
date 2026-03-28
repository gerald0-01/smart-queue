import { College } from "@/generated/prisma/enums";

const collegeFullNames = (college: string) => {
    switch (college) {
        case "CSM":
            return "Collage of Science and Mathematics"
        case "COE":
            return "Collage of Engineering"
        case "CCS":
            return "College of Computer Studies"
        case "CED":
            return "College of Education"
        case "CEBA":
            return "College of Business Administration & Accountancy"
        case "CHS":
            return "Collage of Health Studies"
        default:
            return "Not a valid college."
    }
}

const getEnumOptions = (enumType: Record<string, string>) => {
    return Object.values(enumType).map(value => ({
        value: value,
        label: collegeFullNames(value)
    }))
};

export const collegeOptions = getEnumOptions(College)