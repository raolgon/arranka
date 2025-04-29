import { Link } from "react-router-dom";
import ArrankeCard from "../arrankes/ArrankeCard";
import { Arranke } from "../../types/arranke";

interface NewProjectsShowCaseProps {
    newArrankes: Arranke[];
}

const NewProjectsShowCase = ({ newArrankes }: NewProjectsShowCaseProps) => {
    return (
        <div className="w-full bg-base-200">
            <div className="container mx-auto text-center py-8">
                <h2 className="text-3xl font-bold my-8">arrankes nuevos</h2>
                {newArrankes.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 p-4'>
                        {/* Show up to 9 new arrankes (3 per column in md and lg views) */}
                        {newArrankes.slice(0, 9).map((arranke) => (
                            <ArrankeCard key={arranke.id} arranke={arranke} />
                        ))}
                    </div>
                ) : (
                    // If no arrankes, show a single card with encouraging message
                    <div className="max-w-2xl mx-auto p-4">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <h3 className="card-title text-xl justify-center">¡No hay proyectos nuevos aún!</h3>
                                <p>Sé el primero en crear un proyecto y aparecer en esta sección.</p>
                                <div className="card-actions justify-center mt-4">
                                    <Link to="/newArranke" className="btn btn-primary">Crear mi proyecto</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="py-4">
                    <Link to="/projects" className="btn btn-primary mx-4">ver más arrankes</Link>
                </div>
            </div>
        </div>
    )
}

export default NewProjectsShowCase;