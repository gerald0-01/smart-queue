export default function Page() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col text-center">
                <form>
                    <h1>Enter your MyIIT Email</h1>
                    <div className="flex flex-col text-center">
                        <input className="input-style"/>
                        <button type="submit" className="">/</button>
                    </div>
                </form>
            </div>
        </div>
    )
}