import './RoomJoin.css';

const RoomJoin = ({ onJoin }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const roomId = e.target.roomId.value.trim();
        if (roomId) {
            onJoin(roomId);
        } else {
            alert('Please enter a room ID');
        }
    };

    return (
        <div className="room-join-section">
            <form onSubmit={handleSubmit}>
                <label htmlFor="roomId" className="label">
                    Room ID
                </label>
                <input
                    type="text"
                    id="roomId"
                    name="roomId"
                    className="input"
                    placeholder="Enter room ID (e.g., room123)"
                    autoComplete="off"
                />
                <button type="submit" className="btn btn-primary">
                    Join Room
                </button>
            </form>
        </div>
    );
};

export default RoomJoin;
