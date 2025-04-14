import ArrankeCard from "../arrankes/ArrankeCard"

const ProjectsShowcase = () => {
    return (
        <div className="w-full bg-base-100">
            <div className="container mx-auto py-8">
                <h2 className="text-3xl font-bold text-center my-8">proyectos destacados</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4'>
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                    <ArrankeCard />
                </div>
            </div>
        </div>
    )
}

export default ProjectsShowcase;