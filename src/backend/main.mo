import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  public type ScoreEntry = {
    playerName : Text;
    score : Int;
  };

  module ScoreEntry {
    public func compare(a : ScoreEntry, b : ScoreEntry) : Order.Order {
      Int.compare(b.score, a.score);
    };
  };

  let scores = Map.empty<Text, Int>();

  public shared ({ caller }) func submitScore(playerName : Text, score : Int) : async () {
    if (playerName.size() == 0) {
      Runtime.trap("Player name cannot be empty");
    };
    scores.add(playerName, score);
  };

  public query ({ caller }) func getTopScores() : async [ScoreEntry] {
    scores.entries().toArray().map(func((playerName, score)) { { playerName; score } }).sort().sliceToArray(0, 10);
  };
};
