var PepInputView = Backbone.View.extend({
  
  events: {
    "change":  "contentChanged",
    "keyup": "contentChanged",
  },

  initialize: function() {
    this.listenTo(this.model, 'changed:CL', this.changeContent);
    this.listenTo(this.model, 'changed:mod', this.changeContent);
  },

  contentChanged: function(e) {
    var pep = this.el.value;
    var self = this;
    //update model with input data
    $.post( "./forms/convertPeps.php", {peps: pep}).done(function( data ) {
      obj = JSON.parse(data);
      self.model.set({JSONdata:obj}); 
    });
    modTable.ajax.url( "forms/convertMods.php?peps="+encodeURIComponent(pep)).load();

  },

  changeContent: function() {
    var pepStrsArr = [];
    for(i=0; i < this.model.peptides.length; i++){
      pepStrsArr[i] = "";
      for(j = 0; j < this.model.peptides[i].sequence.length; j++){
        pepStrsArr[i] += this.model.peptides[i].sequence[j].aminoAcid+this.model.peptides[i].sequence[j].Modification;
        //insert the # for the crosslink
        if (this.model.JSONdata.LinkSite.length > 0){
          for (var k = 0; k < this.model.JSONdata.LinkSite.length; k++) {
            if (this.model.JSONdata.LinkSite[k].peptideId == i && this.model.JSONdata.LinkSite[k].linkSite == j)
              pepStrsArr[i] += "#" // + (this.model.JSONdata.LinkSite[k].id+1); only needed for multiple cls
          }
        }
      }
    }

    pepsStr = pepStrsArr.join(";");
    this.el.value = pepsStr;   
    modTable.ajax.url( "forms/convertMods.php?peps="+encodeURIComponent(pepsStr)).load();
  },


});