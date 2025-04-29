import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Arranke } from "../../types/arranke";
import { getDisplayName } from "../../utils/displayNamePreference";
import LikeDislikeButtons from "./LikeDislikeButtons";

interface ArrankeOfTheDayProps {
    arranke?: Arranke;
}

function ArrankeOfTheDayCard({ arranke }: ArrankeOfTheDayProps) {
    // If no featured arranke is available, show a placeholder
    if (!arranke) {
        return(
            <div className="card card-border border-primary lg:card-side bg-base-100 shadow-sm">
                <figure className="flex items-center justify-center p-4">
                    <img
                    src="https://placehold.co/200x200/orange/white?text=Destacado"
                    alt="logo"
                    className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] object-cover rounded-lg" />
                </figure>
                <div className="card-body">
                    <h2 className="card-title">Tu proyecto podría estar aquí</h2>
                    <p>Crea un arranke y compártelo con la comunidad para destacar en la página principal</p>
                    <div className="card-actions justify-end">
                        <Link to="/newArranke" className="btn btn-primary">
                            <SquareArrowOutUpRight className="mr-2" />
                            Crear Arranke
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className="card card-border border-primary lg:card-side bg-base-100 shadow-sm">
            <figure className="flex items-center justify-center p-2">
                <img
                src={arranke.logo_url || "https://placehold.co/200x200/orange/white"}
                alt={arranke.arranke_name}
                className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] lg:w-[200px] lg:h-[200px] object-cover rounded-lg" />
            </figure>
            <div className="card-body">
                <h2 className="card-title">Arranke destacado del día</h2>
                <p>{arranke.arranke_slogan || arranke.arranke_description?.substring(0, 120) || "Sin descripción"}</p>
                <div className="badge badge-accent mb-2">{arranke.arranke_category || "Destacado"}</div>
                <p className="text-sm">Creado por: {getDisplayName(arranke.arranke_name, arranke.owner_name, arranke.owner_username, arranke.display_name_preference)}</p>
                <div className="card-actions justify-end">
                    <LikeDislikeButtons
                        arrankeId={arranke.id.toString()}
                        initialLikes={arranke.likes_count || 0}
                        initialDislikes={arranke.dislikes_count || 0}
                    />
                    <Link to={`/${arranke.arranke_name}`} className="btn btn-primary">
                        <SquareArrowOutUpRight className="mr-2" />
                        Ver Proyecto
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ArrankeOfTheDayCard;