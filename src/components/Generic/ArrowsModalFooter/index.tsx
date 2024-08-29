import { useContext } from "react"
import { BsFillArrowDownCircleFill, BsFillArrowUpCircleFill } from "react-icons/bs";
import { AppContext } from "../../../context/app.ctx"

export function ArrowModalFooter() {

    const { modalFooterOpened, setModalFooterOpened } = useContext(AppContext);

    return (
        <>
            {
                window.innerWidth < 768
                    ?

                    modalFooterOpened
                        ?
                        <BsFillArrowDownCircleFill size={25} className="position-absolute" style={{ top: 0, left: "50%", transform: "translate(-50%, -75%)", zIndex: 999 }}
                            onClick={() => setModalFooterOpened(false)}
                        />
                        :
                        < BsFillArrowUpCircleFill size={25} className="position-absolute" style={{ top: 0, left: "50%", transform: "translate(-50%, -75%)", zIndex: 999 }}
                            onClick={() => setModalFooterOpened(true)}
                        />
                    :
                    null
            }
        </>
    ) 

}