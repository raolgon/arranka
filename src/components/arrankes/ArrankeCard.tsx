import { ThumbsUp, ThumbsDown, SquareArrowOutUpRight } from "lucide-react";

const ArrankeCard = () => {
    return (
        <div className="card lg:card-side bg-base-100 shadow-sm border-2 border-primary">
            <figure>
                <img
                src="https://placehold.co/200x200/blue/white"
                alt="lgo" />
            </figure>
            <div className="card-body ">
                <h2 className="card-title">titulo</h2>
                <p>describcion corta de el arranke de menos de 120 caracteres</p>
                <p>creador por: usuario</p>
                <div className="badge badge-accent">categoria</div>
                <div className="card-actions justify-end">
                    <button className="btn btn-ghost">69<ThumbsUp size={24} /></button>
                    <button className="btn btn-ghost">3<ThumbsDown size={24} /></button>
                    <button className="btn btn-primary">< SquareArrowOutUpRight size={24} /></button>
                </div>
            </div>
        </div>
    )
}

export default ArrankeCard;