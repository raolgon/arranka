import ArrankeCard from "../arrankes/ArrankeCard"

const NewProjectsShowCase = () => {
    return (
        <div className="w-full bg-base-200">
            <div className="container mx-auto text-center py-8">
                <h2 className="text-3xl font-bold my-8">arrankes nuevos</h2>
                <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4'>
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                </div>
                <div className="py-4">
                    <button className="btn btn-primary mx-4">ver mas arrankes</button>
                </div>
            </div>
        </div>
    )
}

export default NewProjectsShowCase;