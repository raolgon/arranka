import { Link } from "react-router-dom";
import ArrankeCard from "../arrankes/ArrankeCard";
import { Arranke } from "../../types/arranke";

interface ProjectsShowcaseProps {
    topArrankes: Arranke[];
}

const ProjectsShowcase = ({ topArrankes }: ProjectsShowcaseProps) => {
    return (
        <div className="w-full bg-base-100">
            <div className="container mx-auto py-8">
                <h2 className="text-3xl font-bold text-center my-8">proyectos destacados</h2>
                {topArrankes.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 p-4'>
                        {/* Show up to 4 top arrankes (2 per column in md and lg views) */}
                        {topArrankes.slice(0, 4).map((arranke) => (
                            <ArrankeCard key={arranke.id} arranke={arranke} />
                        ))}
                    </div>
                ) : (
                    // If no arrankes, show a single card with encouraging message
                    <div className="max-w-2xl mx-auto p-4">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <h3 className="card-title text-xl justify-center">¡No hay proyectos destacados aún!</h3>
                                <p>Sé el primero en crear un proyecto y destacar en esta sección.</p>
                                <div className="card-actions justify-center mt-4">
                                    <Link to="/newArranke" className="btn btn-primary">Crear mi proyecto</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="text-center mt-4">
                    <Link to="/projects" className="btn btn-primary">Ver más proyectos</Link>
                </div>
            </div>
        </div>
    )
}

export default ProjectsShowcase;